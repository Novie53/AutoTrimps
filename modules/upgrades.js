//MODULES["upgrades"] = {};


function AT_buyUpgrades() {
	if (game.global.challengeActive == 'Scientist') return;

	for (let upgrade in AT_Constants.UpgradeList) {
		upgrade = AT_Constants.UpgradeList[upgrade];
		let gameUpgrade = game.upgrades[upgrade];
		if (!(gameUpgrade.allowed > gameUpgrade.done && canAffordTwoLevel(gameUpgrade))) continue;
		//Will only move past this if the upgrade is available and affordable
		
		if (upgrade == "Gymystic") continue; // Gymystic is handled inside equipment.js
		if (upgrade == 'Coordination' && (getPageSetting('BuyUpgradesNew') == 2 || !canAffordCoordinationTrimps())) continue;
		//if (upgrade == 'Coordination' && (!canAffordCoordinationTrimps() || (getPageSetting('ultwind') >= 1 && game.global.world >= getPageSetting('ultwind') && HDratioy() < getPageSetting('ultwindcut') && game.global.challengeActive != "Daily"))) continue;
		//if (upgrade == 'Coordination' && (!canAffordCoordinationTrimps() || (getPageSetting('dultwind') >= 1 && game.global.world >= getPageSetting('dultwind') && HDratioy() < getPageSetting('dultwindcut') && game.global.challengeActive == "Daily"))) continue;
		//if (upgrade == 'Coordination' && getEmpowerment() == "Wind" && HDratioy() <= getPageSetting('windcutoff') && getPageSetting('hardcorewind') >= 1 && game.global.world >= getPageSetting('hardcorewind') && (game.global.world < getPageSetting('hardcorewindmax') || getPageSetting('hardcorewindmax')<=0) && game.global.challengeActive != "Daily") continue;
		//if (upgrade == 'Coordination' && getEmpowerment() == "Wind" && HDratioy() <= getPageSetting('dwindcutoff') && getPageSetting('dhardcorewind') >= 1 && game.global.world >= getPageSetting('dhardcorewind') && (game.global.world < getPageSetting('dhardcorewindmax') || getPageSetting('dhardcorewindmax')<=0) && game.global.challengeActive == "Daily") continue;
		if (upgrade == 'Shieldblock' && !getPageSetting('BuyShieldblock')) continue;
		if (upgrade == 'Gigastation' && (game.global.lastWarp ? game.buildings.Warpstation.owned < (Math.floor(game.upgrades.Gigastation.done * getPageSetting('DeltaGigastation')) + getPageSetting('FirstGigastation')) : game.buildings.Warpstation.owned < getPageSetting('FirstGigastation'))) continue;
		
		//Main logics:
		if (game.upgrades.Scientists.done < game.upgrades.Scientists.allowed && upgrade != 'Scientists') continue;
		buyUpgrade(upgrade, true, true);
		debug('Upgraded ' + upgrade, "upgrades", "*upload2");
	}
}



//Radon

var RupgradeList = ['Miners', 'Scientists', 'Coordination', 'Speedminer', 'Speedlumber', 'Speedfarming', 'Speedscience', 'Speedexplorer', 'Megaminer', 'Megalumber', 'Megafarming', 'Megascience', 'Efficiency', 'Explorers', 'Battle', 'Bloodlust', 'Bounty', 'Egg', 'Rage', 'Prismatic', 'Prismalicious', 'Formations', 'Dominance', 'UberHut', 'UberHouse', 'UberMansion', 'UberHotel', 'UberResort', 'Trapstorm', 'Potency'];

function RbuyUpgrades() {

    for (var upgrade in RupgradeList) {
        upgrade = RupgradeList[upgrade];
        var gameUpgrade = game.upgrades[upgrade];
        var available = (gameUpgrade.allowed > gameUpgrade.done && canAffordTwoLevel(gameUpgrade));
			
        //Coord
	if (upgrade == 'Coordination' && (getPageSetting('RBuyUpgradesNew') == 2 || !canAffordCoordinationTrimps())) continue;

        //Other
        if (!available) continue;
        if (game.upgrades.Scientists.done < game.upgrades.Scientists.allowed && upgrade != 'Scientists') continue;
            buyUpgrade(upgrade, true, true);
            debug('Upgraded ' + upgrade, "upgrades", "*upload2");
        }
}

function RautoGoldenUpgradesAT(setting) {
    var num = getAvailableGoldenUpgrades();
    var setting2;
    if (num == 0) return;
    if (setting == "Radon")
	setting2 = "Helium";
    if ((!game.global.dailyChallenge.seed && !game.global.runningChallengeSquared && autoTrimpSettings.RAutoGoldenUpgrades.selected == "Radon" && getPageSetting('Rradonbattle') > 0 && game.goldenUpgrades.Helium.purchasedAt.length >= getPageSetting('Rradonbattle')) || (game.global.dailyChallenge.seed && autoTrimpSettings.RdAutoGoldenUpgrades.selected == "Radon" && getPageSetting('Rdradonbattle') > 0 && game.goldenUpgrades.Helium.purchasedAt.length >= getPageSetting('Rdradonbattle')))
	setting2 = "Battle";
    if (setting == "Battle")
	setting2 = "Battle";
    if ((!game.global.dailyChallenge.seed && !game.global.runningChallengeSquared && autoTrimpSettings.RAutoGoldenUpgrades.selected == "Battle" && getPageSetting('Rbattleradon') > 0 && game.goldenUpgrades.Battle.purchasedAt.length >= getPageSetting('Rbattleradon')) || (game.global.dailyChallenge.seed && autoTrimpSettings.RdAutoGoldenUpgrades.selected == "Battle" && getPageSetting('Rdbattleradon') > 0 && game.goldenUpgrades.Battle.purchasedAt.length >= getPageSetting('Rdbattleradon')))
	setting2 = "Helium";
    if (setting == "Void" || setting == "Void + Battle")
        setting2 = "Void";
    if (game.global.challengeActive == "Mayhem") {
	setting2 = "Battle";
    }
    var success = buyGoldenUpgrade(setting2);
    if (!success && setting2 == "Void") {
        num = getAvailableGoldenUpgrades();
        if (num == 0) return;
	if ((autoTrimpSettings.RAutoGoldenUpgrades.selected == "Void" && !game.global.dailyChallenge.seed && !game.global.runningChallengeSquared) || (autoTrimpSettings.RdAutoGoldenUpgrades.selected == "Void" && game.global.dailyChallenge.seed))
	setting2 = "Helium";
	if (((autoTrimpSettings.RAutoGoldenUpgrades.selected == "Void" && getPageSetting('Rvoidheliumbattle') > 0 && game.global.world >= getPageSetting('Rvoidheliumbattle')) || (autoTrimpSettings.RdAutoGoldenUpgrades.selected == "Void" && getPageSetting('Rdvoidheliumbattle') > 0 && game.global.world >= getPageSetting('Rdvoidheliumbattle'))) || ((autoTrimpSettings.RAutoGoldenUpgrades.selected == "Void + Battle" && !game.global.dailyChallenge.seed && !game.global.runningChallengeSquared) || (autoTrimpSettings.RdAutoGoldenUpgrades.selected == "Void + Battle" && game.global.dailyChallenge.seed) || (autoTrimpSettings.RcAutoGoldenUpgrades.selected == "Void + Battle" && game.global.runningChallengeSquared)))
        setting2 = "Battle";
	buyGoldenUpgrade(setting2);
    }
}
