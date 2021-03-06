MODULES["gather"] = {};
MODULES.gather.minTraps = 5;				//How many traps to gather before stopping
MODULES.gather.TrapBreedingMod = 10;		//How many multiples breeding has to be better than manually trapping before stopping even with trapping activated
MODULES.gather.ScienceGatherMod = 10;		//How many multiples better is Scientist has to gather before stopping manually gathering


function AT_gather() {
	let lowOnTraps = game.buildings.Trap.owned < MODULES.gather.minTraps;
	let notFullPop = game.resources.trimps.owned < game.resources.trimps.realMax();

	
	//FRESH GAME LOWLEVEL NOHELIUM CODE.
	if (game.global.world == 1 && !canAffordBuilding('Trap') && game.global.buildingsQueue.length == 0 && game.buildings.Trap.owned == 0) {
		if (!game.triggers.wood.done || game.resources.food.owned < 10 || Math.floor(game.resources.food.owned) < Math.floor(game.resources.wood.owned))
			setGather('food');
		else
			setGather('wood');
		return;
	}



	//Traps and Trimps. Will only use traps while it is not useless
	if (autoTrimpSettings.TrapTrimps.enabled && game.buildings.Trap.owned > 0 && notFullPop && 
	   (Math.min(10, game.global.playerModifier / 5) * (game.portal.Bait.level + 1) * MODULES.gather.TrapBreedingMod) > breedingPS()) {
		setGather('trimps');
		return;
	}
	if (autoTrimpSettings.TrapTrimps.enabled && lowOnTraps)
		AT_safeBuyBuilding('Trap', 10);


	//Buildings:
	if ((game.global.buildingsQueue.length >= 1 && !bwRewardUnlocked("Foremany") &&
	   !(game.global.buildingsQueue.length == 1 && game.global.buildingsQueue[0] == 'Trap.1')) ||
		(autoTrimpSettings.TrapTrimps.enabled && lowOnTraps && notFullPop))	{
		setGather('buildings');
		return;
	}


	//Science:
	//if we have some upgrades sitting around which we don't have enough science for, gather science
	//Same has Traps; Will only gather science if it is not useless
	if (document.getElementById('scienceCollectBtn').style.display != 'none' && document.getElementById('science').style.visibility != 'hidden') {
		if ((game.resources.science.owned < 100 || (game.resources.science.owned < AT_scienceNeeded() && 
			(getPlayerModifier() * MODULES.gather.ScienceGatherMod) > getPerSecBeforeManual('Scientist'))) && 
			 getPageSetting('ManualGather2') != 2) {
			setGather('science');
			return;
		}
	}


	if (game.global.turkimpTimer > 0) {
		setGather('metal');
	}
	else {
		let lowestResource = "";
		let lowestResourceRate = -1;
		for (let resource in AT_Constants.ManualResourceList) {
			if (document.getElementById(resource).style.visibility == "hidden") continue;
			
			let currentRate = game.jobs[AT_Constants.ManualResourceList[resource]].owned * game.jobs[AT_Constants.ManualResourceList[resource]].modifier;
			if (currentRate < lowestResourceRate || lowestResourceRate == -1) {
				lowestResourceRate = currentRate;
				lowestResource = resource;
			}
		}
		setGather(lowestResource);
	}
}







//RGather
MODULES.gather.RminScienceAmount = 200;
MODULES.gather.RminScienceSeconds = 60;

function RmanualLabor2() {
    //Vars
    var lowOnTraps = game.buildings.Trap.owned < 5;
    var trapTrimpsOK = getPageSetting('RTrapTrimps');
    var hasTurkimp = game.talents.turkimp2.purchased || game.global.turkimpTimer > 0;
    var needToTrap = (game.resources.trimps.max - game.resources.trimps.owned >= game.resources.trimps.max * 0.05) || (game.resources.trimps.getCurrentSend() > game.resources.trimps.owned - game.resources.trimps.employed);
    var fresh = false;
    //ULTRA FRESH
    if (!game.upgrades.Battle.done) {
	fresh = true;
	if (game.resources.food.owned < 10) {
	    setGather('food');
	}
	if (game.resources.wood.owned < 10 && game.resources.food.owned >= 10) {
	    setGather('wood');
	}
	if (game.resources.food.owned >= 10 && game.resources.wood.owned >= 10) {
	    safeBuyBuilding('Trap');
	}
	if (game.buildings.Trap.owned > 0 && game.resources.trimps.owned < 1) {
	    setGather('trimps');
	}
	if (game.resources.trimps.owned >= 1) {
	    setGather('science');
	}
	return;
    }
    if (game.upgrades.Battle.done && game.upgrades.Scientists.allowed && !game.upgrades.Scientists.done && game.resources.science.owned < 100) {
	fresh = true;
	setGather('science');
	return;
    }
    if (game.upgrades.Battle.done && game.upgrades.Miners.allowed && !game.upgrades.Miners.done && game.resources.science.owned < 60) {
	fresh = true;
	setGather('science');
	return;
    }
	
    //FRESH GAME NO RADON CODE.
    if (!fresh && game.global.world <=3 && game.global.totalRadonEarned<=5000) {
        if (game.global.buildingsQueue.length == 0 && (game.global.playerGathering != 'trimps' || game.buildings.Trap.owned == 0)){
            if (!game.triggers.wood.done || game.resources.food.owned < 10 || Math.floor(game.resources.food.owned) < Math.floor(game.resources.wood.owned))
                setGather('food');
            else
                setGather('wood');
        }
	return;
    }
    if (game.global.challengeActive == "Quest" && (questcheck() == 10 || questcheck() == 20)) {
	setGather('food');
    }
    else if (game.global.challengeActive == "Quest" && (questcheck() == 11 || questcheck() == 21)) {
	setGather('wood');
    }
    else if (game.global.challengeActive == "Quest" && (questcheck() == 12 || questcheck() == 22)) {
	setGather('metal');
    }
    else if (game.global.challengeActive == "Quest" && (questcheck() == 14 || questcheck() == 24)) {
	setGather('science');
    }
    else if (Rshouldshipfarm) {
	     setGather('food');
    }
    else if ((Rshouldtimefarm || Rshouldtimefarmbogs) && autoTrimpSettings.Rtimegatherselection.selected == "Food") {
	     setGather('food');
    }
    else if ((Rshouldtimefarm || Rshouldtimefarmbogs) && autoTrimpSettings.Rtimegatherselection.selected == "Wood") {
	     setGather('wood');
    }
    else if ((Rshouldtimefarm || Rshouldtimefarmbogs) && autoTrimpSettings.Rtimegatherselection.selected == "Metal") {
	     setGather('metal');
    }
    else if ((Rshouldtimefarm || Rshouldtimefarmbogs) && autoTrimpSettings.Rtimegatherselection.selected == "Science") {
	     setGather('science');
    }
    else if (getPageSetting('RManualGather2') != 2 && game.resources.science.owned < MODULES["gather"].RminScienceAmount && document.getElementById('scienceCollectBtn').style.display != 'none' && document.getElementById('science').style.visibility != 'hidden') {
             setGather('science');
    }
    else if (game.resources.science.owned < (RscienceNeeded*0.8) && document.getElementById('scienceCollectBtn').style.display != 'none' && document.getElementById('science').style.visibility != 'hidden') {
	     setGather('science');
    }
    else if (trapTrimpsOK && needToTrap && game.buildings.Trap.owned == 0 && canAffordBuilding('Trap')) {
         if (!safeBuyBuilding('Trap'))
             setGather('buildings');
    }
    else if (trapTrimpsOK && needToTrap && game.buildings.Trap.owned > 0) {
             setGather('trimps');
    }
    else if (!bwRewardUnlocked("Foremany") && (game.global.buildingsQueue.length ? (game.global.buildingsQueue.length > 1 || game.global.autoCraftModifier == 0 || (getPlayerModifier() > 100 && game.global.buildingsQueue[0] != 'Trap.1')) : false)) {
             setGather('buildings');
    }
    else if (!game.global.trapBuildToggled && (game.global.buildingsQueue[0] == 'Barn.1' || game.global.buildingsQueue[0] == 'Shed.1' || game.global.buildingsQueue[0] == 'Forge.1')){
             setGather('buildings');
    }
    else if (game.resources.science.owned >= RscienceNeeded && document.getElementById('scienceCollectBtn').style.display != 'none' && document.getElementById('science').style.visibility != 'hidden') {
        if (game.global.challengeActive != "Transmute" && (getPlayerModifier() < getPerSecBeforeManual('Scientist') && hasTurkimp)||getPageSetting('RManualGather2') == 2){
            setGather('metal');
        }
        else if (getPageSetting('RManualGather2') != 2){
                 setGather('science');
        }
    }
    else if (trapTrimpsOK){
        if (game.buildings.Trap.owned < 5 && canAffordBuilding('Trap')) {
            safeBuyBuilding('Trap');
            setGather('buildings');
        }
    else if (game.buildings.Trap.owned > 0)
             setGather('trimps');
    }
    else {
        var manualResourceList = {
            'food': 'Farmer',
            'wood': 'Lumberjack',
            'metal': 'Miner',
        };
        var lowestResource = 'food';
        var lowestResourceRate = -1;
        var haveWorkers = true;
        for (var resource in manualResourceList) {
             var job = manualResourceList[resource];
             var currentRate = game.jobs[job].owned * game.jobs[job].modifier;
             if (document.getElementById(resource).style.visibility != 'hidden') {
                 if (currentRate === 0) {
                     currentRate = game.resources[resource].owned;
                     if ((haveWorkers) || (currentRate < lowestResourceRate)) {
                         haveWorkers = false;
                         lowestResource = resource;
                         lowestResourceRate = currentRate;
                     }
                }
                if ((currentRate < lowestResourceRate || lowestResourceRate == -1) && haveWorkers) {
                    lowestResource = resource;
                    lowestResourceRate = currentRate;
                }
            }
         }
        if (game.global.challengeActive == "Transmute" && game.global.playerGathering != lowestResource && !haveWorkers && !breedFire) {
            if (hasTurkimp)
                setGather('food');
            else
                setGather(lowestResource);
        } else if (getPageSetting('RManualGather2') != 2 && document.getElementById('scienceCollectBtn').style.display != 'none' && document.getElementById('science').style.visibility != 'hidden') {
            if (game.resources.science.owned < getPsString('science', true) * MODULES["gather"].RminScienceSeconds && game.global.turkimpTimer < 1 && haveWorkers)
                setGather('science');
            else if (game.global.challengeActive == "Transmute" && hasTurkimp)
                     setGather('food');
            else
                setGather(lowestResource);
        }
        else if(trapTrimpsOK && game.global.trapBuildToggled == true && lowOnTraps)
            setGather('buildings');
        else
            setGather(lowestResource);
    }
}
