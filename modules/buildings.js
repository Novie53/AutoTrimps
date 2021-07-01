MODULES["buildings"] = {};
MODULES.buildings.storageMainCutoff = 0.85;	//when to buy more storage. (85% )
MODULES.buildings.storageLowlvlCutoff1 = 0.7; //when to buy more storage at zone 1
MODULES.buildings.storageLowlvlCutoff2 = 0.5; //when to buy more storage from zone 2-10   (more leeway so it doesnt fill up)
MODULES.buildings.gatewayWall = 1000; //Will only buy gateway when the cost of the gateway is lower than 1/x of the total fragments


function AT_safeBuyBuilding(building, amount = 1) {
	if (!Number.isInteger(amount)) {
		throw "Error, not valid amount input: \"" + amount + "\"";
	}
	if (amount <= 0 || !(building in game.buildings) || game.buildings[building].locked || isBuildingInQueue(building) || !canAffordBuilding(building, false, false, false, false, 1))
		return false;
	
	
	let maxBuyAmount = 1;
	if (building == "Warpstation" && game.global.sLevel >= 4 && game.options.menu.forceQueue.enabled == 0)
		maxBuyAmount = 9999;
	else if (game.talents.deciBuild.purchased)
		maxBuyAmount = 10;
	else if (bwRewardUnlocked("DoubleBuild"))
		maxBuyAmount = 2;
	amount = Math.min(amount, maxBuyAmount);
	amount = Math.min(amount, calculateMaxAfford(game.buildings[building], true, false, false, true));
	
	
	debug("Building " + amount + " " + building + (amount > 1 ? "s" : ""), "buildings", '*hammer2');
	buyBuilding(building, true, true, amount);
	return true

/* 
	if (building == 'Warpstation') {
		if (game.buildings.Warpstation.owned < 2) {
			game.global.buyAmt = 'Max';
			game.global.maxSplit = 1;
		} else {
			game.global.buyAmt = 1;
		}
		buyBuilding(building, true, true);
		debug('Building ' + game.global.buyAmt + ' ' + building + 's', "buildings", '*rocket');
		postBuy2(oldBuy);
		return;
	}
	else {
		debug("Building " + amount + " " + building + (amount > 1 ? "s" : ""), "buildings", '*hammer2');
		buyBuilding(building, true, true, amount);
		return true
	}
	 */
}

function AT_buyFoodEfficientHousing() {
	let buildorder = [];
	for (let house in AT_Constants.FoodHousing) {
		if (game.buildings[AT_Constants.FoodHousing[house]].locked === 1) continue;
		
		let building = game.buildings[AT_Constants.FoodHousing[house]];
		let cost = getBuildingItemPrice(building, "food", false, 1);
		let ratio = cost / building.increase.by;
		buildorder.push({"name": AT_Constants.FoodHousing[house], "ratio": ratio});
		document.getElementById(AT_Constants.FoodHousing[house]).style.border = "1px solid #FFFFFF";
	}
	buildorder.sort(function (a, b) {return a.ratio - b.ratio; });
	
	for (let i = 0; i < buildorder.length; i++) {
		let bb = buildorder[i];
		let max = getPageSetting('Max' + bb.name);
		let buildingsToBuy =  max == -1 ? 9999 : max - game.buildings[bb.name].owned;
		
		if (buildingsToBuy >= 1) {
			document.getElementById(bb.name).style.border = "1px solid #00CC00";
			AT_safeBuyBuilding(bb.name, buildingsToBuy);
			break;
		}
	}
}

function AT_buyGemEfficientHousing() {
	let buildorder = [];
	for (let house in AT_Constants.GemHousing) {
		if (game.buildings[AT_Constants.GemHousing[house]].locked === 1) continue;
		
		let building = game.buildings[AT_Constants.GemHousing[house]];
		let cost = getBuildingItemPrice(building, "gems", false, 1);
		let ratio = cost / building.increase.by;
		//if (AT_Constants.GemHousing[house] == "Gateway" && !canAffordBuilding('Gateway')) continue;
		buildorder.push({"name": AT_Constants.GemHousing[house], "ratio": ratio});
		document.getElementById(AT_Constants.GemHousing[house]).style.border = "1px solid #FFFFFF";
	}
	buildorder.sort(function (a, b) {return a.ratio - b.ratio; });
	
	for (let i = 0; i < buildorder.length; i++) {
		let bb = buildorder[i];
		let max = bb.name == "Warpstation" ? 9999 : getPageSetting('Max' + bb.name);
		let buildingsToBuy = max == -1 ? 9999 : max - game.buildings[bb.name].owned;
		
		if (buildingsToBuy >= 1) {
			document.getElementById(bb.name).style.border = "1px solid #00CC00";
			
			//Gateway Wall
			if (bb.name == "Gateway" && MODULES.buildings.gatewayWall > 1) {
				if (getBuildingItemPrice(game.buildings.Gateway, "fragments", false, 1) > (game.resources.fragments.owned / MODULES.buildings.gatewayWall)) {
					document.getElementById(bb.name).style.border = "1px solid orange";
					continue;
				}
			}
			
			//WarpStation Cap:
			if (bb.name == "Warpstation" && getPageSetting('WarpstationCap')) {
				let currMaxWarp = Math.floor(game.upgrades.Gigastation.done * getPageSetting('DeltaGigastation')) + getPageSetting('FirstGigastation');
				buildingsToBuy = Math.max(currMaxWarp - game.buildings.Warpstation.owned, 0);
				if (buildingsToBuy == 0) {
					//Buys Warpstation anyways to reach new cord
					if (getPageSetting('WarpstationCoordBuy') && 
					   (game.upgrades.Coordination.allowed - game.upgrades.Coordination.done) > 0 && 
						canAffordBuilding("Warpstation") &&
						!canAffordCoordinationTrimps()) {
						let maxAfford = calculateMaxAfford(game.buildings["Warpstation"], true);
						let nextCount = (game.portal.Coordinated.level) ? game.portal.Coordinated.currentSend : game.resources.trimps.maxSoldiers;
						let trimpsNeeded = ((nextCount * 3) - game.resources.trimps.realMax());
						
						let increase = game.buildings.Warpstation.increase.by;
						if (game.portal.Carpentry.level && game.buildings.Warpstation.increase.what == "trimps.max") increase *= Math.pow(1.1, game.portal.Carpentry.level);
						if (game.portal.Carpentry_II.level && game.buildings.Warpstation.increase.what == "trimps.max") increase *= (1 + (game.portal.Carpentry_II.modifier * game.portal.Carpentry_II.level));
						if (trimpsNeeded < (increase * maxAfford))
							buildingsToBuy = Math.ceil(trimpsNeeded / increase);
						else
							continue;
					}
					else
						continue;
				}
			}
			AT_safeBuyBuilding(bb.name, buildingsToBuy);
			break;
		}
	}
}

function AT_buyBuildings() {
	if ((game.jobs.Miner.locked && game.global.challengeActive != 'Metal') || (game.jobs.Scientist.locked && game.global.challengeActive != "Scientist"))
		return;
	AT_buyFoodEfficientHousing();  //["Hut", "House", "Mansion", "Hotel", "Resort"];
	AT_buyGemEfficientHousing();   //["Hotel", "Resort", "Gateway", "Collector", "Warpstation"];
	if (!game.buildings.Wormhole.locked && getPageSetting('MaxWormhole') > 0)
		AT_safeBuyBuilding('Wormhole', getPageSetting('MaxWormhole') - game.buildings.Wormhole.owned);
	if (!game.buildings.Tribute.locked)
		AT_safeBuyBuilding('Tribute', getPageSetting('MaxTribute') == -1 ? 10 : getPageSetting('MaxTribute') - game.buildings.Tribute.owned);

	//Gyms:
	if (!game.buildings.Gym.locked && (getPageSetting('MaxGym') > game.buildings.Gym.owned || getPageSetting('MaxGym') == -1)) {
		var skipGym = false;
	
		//Dynamic Gyms
		if (getPageSetting('DynamicGyms')) {
			//Enemy stats
			var block = calcOurBlock() / (game.global.brokenPlanet ? 2 : 1);
			var pierce = getPierceAmt() * (game.global.formation == 3 ? 2 : 1);
			var nextGym = game.upgrades.Gymystic.modifier + Math.max(0, game.upgrades.Gymystic.done-1)/100;
			var currentEnemyDamageOK = block > nextGym * calcSpecificEnemyAttack();
			var zoneEnemyDamageOK = block > calcEnemyAttack() * (1 - pierce);

			//Challenge stats
			var moreBlockThanHealth = block >= nextGym * calcOurHealth(true, true);
			var crushedOK = game.global.challengeActive != "Crushed";
			var explosiveOK = game.global.challengeActive != "Daily" || typeof game.global.dailyChallenge.explosive == "undefined";
			//var critDailyOK = game.global.challengeActive != "Daily" || typeof game.global.dailyChallenge.crits == "undefined";
			var challengeOK = moreBlockThanHealth || crushedOK && explosiveOK;

			//Stop buying Gyms if we already have enough block for our current enemy and also a C99 Snimp
			if (currentEnemyDamageOK && zoneEnemyDamageOK && challengeOK) skipGym = true;
		}
	
		//Gym Wall
		var gymwallpct = getPageSetting('GymWall');
		if (gymwallpct > 1) {
			if (getBuildingItemPrice(game.buildings.Gym, "wood", false, 1) * Math.pow(1 - game.portal.Resourceful.modifier, game.portal.Resourceful.level)
				> (game.resources.wood.owned / gymwallpct))
					skipGym = true;
		}

		//ShieldBlock cost Effectiveness:
		if (game.equipment['Shield'].blockNow) {
			var gymEff = evaluateEquipmentEfficiency('Gym');
			var shieldEff = evaluateEquipmentEfficiency('Shield');
			if ((gymEff.Wall) || (gymEff.Factor <= shieldEff.Factor && !gymEff.Wall))
				skipGym = true;
		}
	
		//Buy Gym
		if (!needGymystic && !skipGym)
			AT_safeBuyBuilding('Gym');
	   	needGymystic = false;
	}
	
	//Nurseries
	if (!game.buildings.Nursery.locked) {
		let maxNurseAmount = getPageSetting('MaxNursery') == -1 ? 99999 : getPageSetting('MaxNursery');
		let spireOverride = false;
		//Spire override
		if (getPageSetting('PreSpireNurseries') != -1 && isActiveSpireAT()) {
			maxNurseAmount = getPageSetting('PreSpireNurseries');
			spireOverride = true;
		}
		if (spireOverride || getPageSetting('NoNurseriesUntil') == -1 || game.global.world < getPageSetting('NoNurseriesUntil')) {
			AT_safeBuyBuilding('Nursery', maxNurseAmount - game.buildings.Nursery.owned);
		}
	}
}

function AT_buyStorage() {
	let packMod = 1 + game.portal.Packrat.level * game.portal.Packrat.modifier;
	let Bs = {
		'Barn': 'food',
		'Shed': 'wood',
		'Forge': 'metal'
	};
	for (let storageBuilding in AT_Constants.ResourcerStorageList) {
		if (!game.triggers[storageBuilding].done) continue;
		let jest = 0;
		let owned = game.resources[AT_Constants.ResourcerStorageList[storageBuilding]].owned;
		let max = game.resources[AT_Constants.ResourcerStorageList[storageBuilding]].max * packMod;
		max = calcHeirloomBonus("Shield", "storageSize", max);
		if (game.global.mapsActive && game.unlocks.imps.Jestimp) {
			jest = simpleSeconds(AT_Constants.ResourcerStorageList[storageBuilding], 45);
			jest = scaleToCurrentMap(jest);
		}
		if ((game.global.world == 1 && owned > max * MODULES.buildings.storageLowlvlCutoff1) ||
			(game.global.world >= 2 && game.global.world < 10 && owned > max * MODULES.buildings.storageLowlvlCutoff2) ||
			(owned + jest > max * MODULES.buildings.storageMainCutoff)) {
			AT_safeBuyBuilding(storageBuilding, 1);
		}
	}
}









//Radon

var RhousingList = ['Hut', 'House', 'Mansion', 'Hotel', 'Resort', 'Gateway', 'Collector'];

function RsafeBuyBuilding(building) {
	if (isBuildingInQueue(building))
		return false;
	if (game.buildings[building].locked)
		return false;
	var oldBuy = preBuy2();

  if (game.talents.deciBuild.purchased) {
		game.global.buyAmt = 10;
	if (!canAffordBuilding(building)) {
		game.global.buyAmt = 2;
	if (!canAffordBuilding(building))
			game.global.buyAmt = 1;
	 }
  }
  else if (bwRewardUnlocked("DoubleBuild")) {
		game.global.buyAmt = 2;
  	if (!canAffordBuilding(building)) 
		game.global.buyAmt = 1;
  }		
  else game.global.buyAmt = 1;

  if (!canAffordBuilding(building)) {
	  postBuy2(oldBuy);
	  return false;
  }

	game.global.firing = false;
	
	debug('Building ' + building, "buildings", '*hammer2');
	if (!game.buildings[building].locked && canAffordBuilding(building)) {
		buyBuilding(building, true, true);
	}
	postBuy2(oldBuy);
	return true;
}

function RbuyFoodEfficientHousing() {
	var foodHousing = ["Hut", "House", "Mansion", "Hotel", "Resort"];
	var unlockedHousing = [];
	for (var house in foodHousing) {
		if (game.buildings[foodHousing[house]].locked === 0) {
			unlockedHousing.push(foodHousing[house]);
		}
	}
	var buildorder = [];
	if (unlockedHousing.length > 0) {
	for (var house in unlockedHousing) {
		var building = game.buildings[unlockedHousing[house]];
		var cost = getBuildingItemPrice(building, "food", false, 1);
		var ratio = cost / building.increase.by;
		buildorder.push({
			'name': unlockedHousing[house],
			'ratio': ratio
		});
		document.getElementById(unlockedHousing[house]).style.border = "1px solid #FFFFFF";
	}
	buildorder.sort(function (a, b) {
		return a.ratio - b.ratio;
	});
	var bestfoodBuilding = null;
	var bb = buildorder[0];
	var max = getPageSetting('RMax' + bb.name);
	if (game.buildings[bb.name].owned < max || max == -1) {
		bestfoodBuilding = bb.name;
	}
	if (smithylogic(bestfoodBuilding, 'wood', false) && bestfoodBuilding) {
		document.getElementById(bestfoodBuilding).style.border = "1px solid #00CC01";
		RsafeBuyBuilding(bestfoodBuilding);
	}
	}
}

function RbuyGemEfficientHousing() {
	var gemHousing = ["Mansion", "Hotel", "Resort", "Gateway", "Collector"];
	var unlockedHousing = [];
	for (var house in gemHousing) {
		if (game.buildings[gemHousing[house]].locked === 0) {
			unlockedHousing.push(gemHousing[house]);
		}
	}
	var obj = {};
	for (var house in unlockedHousing) {
		var building = game.buildings[unlockedHousing[house]];
		var cost = getBuildingItemPrice(building, "gems", false, 1);
		var ratio = cost / building.increase.by;
		obj[unlockedHousing[house]] = ratio;
		document.getElementById(unlockedHousing[house]).style.border = "1px solid #FFFFFF";
	}
	var keysSorted = Object.keys(obj).sort(function (a, b) {
			return obj[a] - obj[b];
		});
	bestBuilding = null;
	for (var best in keysSorted) {
		var max = getPageSetting('RMax' + keysSorted[best]);
		if (max === false) max = -1;
		if (game.buildings[keysSorted[best]].owned < max || max == -1) {
			bestBuilding = keysSorted[best];
			document.getElementById(bestBuilding).style.border = "1px solid #00CC00";
			break;
		}
	}
	if (smithylogic(bestBuilding, 'gems', false) && bestBuilding) {
		RsafeBuyBuilding(bestBuilding);
	}
}

var smithybought = 0;

function mostEfficientHousing() {

	//Housing
	var HousingTypes = ['Hut', 'House', 'Mansion', 'Hotel', 'Resort', 'Gateway', 'Collector'];

	// Which houses we actually want to check
	var housingTargets = [];
	for (var house of HousingTypes) {
		var maxHousing = (getPageSetting('RMax' + house) === -1 ? Infinity : getPageSetting('RMax' + house));
		if (!game.buildings[house].locked && game.buildings[house].owned < maxHousing) {
			housingTargets.push(house);
		}
	}

	var mostEfficient = {
		name: "",
		time: Infinity
	}

	for (var housing of housingTargets) {

		var worstTime = -Infinity;
		var currentOwned = game.buildings[housing].owned;
		for (var resource in game.buildings[housing].cost) {

			// Get production time for that resource
			var baseCost = game.buildings[housing].cost[resource][0];
			var costScaling = game.buildings[housing].cost[resource][1];
			var avgProduction = getPsString(resource, true);
			if (avgProduction <= 0) avgProduction = 1;
			var housingBonus = game.buildings.Hut.increase.by;
			if (!game.buildings.Hub.locked) { housingBonus += 500;}

			// Only keep the slowest producer, aka the one that would take the longest to generate resources for
			worstTime = Math.max(baseCost * Math.pow(costScaling, currentOwned - 1) / (avgProduction * housingBonus), worstTime);
		}

		if (mostEfficient.time > worstTime) {
			mostEfficient.name = housing;
			mostEfficient.time = worstTime;
		}
	}
	if (mostEfficient.name == "") mostEfficient.name = null;

	return mostEfficient.name;
}

function RbuyBuildings() {
 
	// Storage, shouldn't be needed anymore that autostorage is lossless
	if (!game.global.autoStorage) {toggleAutoStorage(false);}
 
	//Smithy
	if (!game.buildings.Smithy.locked && canAffordBuilding('Smithy')) {
		// On quest challenge
		if (game.global.challengeActive == 'Quest') {
			if (smithybought > game.global.world) {smithybought = 0;}
 
			if (smithybought < game.global.world && (questcheck() == 7 || (RcalcHDratio() * 10 >= getPageSetting('Rmapcuntoff')))) {
				buyBuilding("Smithy", true, true, 1);
				smithybought = game.global.world;
			}
		} else {
			buyBuilding("Smithy", true, true, 1);
		}
	}
 
	//Microchip
	if (!game.buildings.Microchip.locked && canAffordBuilding('Microchip')) {
		buyBuilding('Microchip', true, true, 1);
	}
 
	//Housing
	var HousingTypes = ['Hut', 'House', 'Mansion', 'Hotel', 'Resort', 'Gateway', 'Collector'];
 
	// Which houses we actually want to check
	var housingTargets = [];
	for (var house in HousingTypes) {
		var maxHousing = (getPageSetting('RMax' + house) === -1 ? Infinity : getPageSetting('RMax' + house));
		if (!game.buildings[HousingTypes[house]].locked && game.buildings[HousingTypes[house]].owned < maxHousing) {
			housingTargets.push(house);
		}
	}
 
	var boughtHousing = false;
 
	do {
 
		boughtHousing = false;
		var housing = mostEfficientHousing();
 
		if (housing != null && canAffordBuilding(housing) && game.buildings[housing].purchased < (getPageSetting('RMax' + housing) === -1 ? Infinity : getPageSetting('RMax' + housing))) {
			buyBuilding(housing, true, true, 1);
			boughtHousing = true;
		}
	} while (boughtHousing)
 
	//Tributes
	if (!game.buildings.Tribute.locked) {
		var buyTributeCount = getMaxAffordable(Math.pow(1.05, game.buildings.Tribute.owned) * 10000, game.resources.food.owned,1.05,true);
		
		if (getPageSetting('RMaxTribute') > game.buildings.Tribute.owned) {
			buyTributeCount = Math.min(buyTributeCount, getPageSetting('RMaxTribute') - game.buildings.Tribute.owned);
		}
 	if (getPageSetting('RMaxTribute') < 0 || (getPageSetting('RMaxTribute') > game.buildings.Tribute.owned)) {
			buyBuilding('Tribute', true, true, buyTributeCount);
	}
	}
	
	//Labs
	if (!game.buildings.Laboratory.locked && getPageSetting('Rnurtureon') == true) {	
 	if (getPageSetting('RMaxLabs') < 0 || (getPageSetting('RMaxLabs') > game.buildings.Laboratory.owned)) {
			buyBuilding('Laboratory', true, true, 1);
	}
	}
 
}
