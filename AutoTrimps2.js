var atscript = document.getElementById("AutoTrimps-script");
var basepath = "https://novie53.github.io/AutoTrimps/", modulepath="modules/";
//if (atscript !== null) basepath = atscript.src.replace(/AutoTrimps2\.js$/,'');

function ATscriptLoad(pathname, modulename) {
	if (modulename == null) debug("Wrong Syntax. Script could not be loaded. Try ATscriptLoad(modulepath, 'example.js');", "all");
	let script = document.createElement('script');
	if (pathname == null) pathname = '';
	script.src = basepath + pathname + modulename + '.js';
	script.id = modulename + '_MODULE';
	document.head.appendChild(script);
}
function ATscriptUnload(id) {
	let $link = document.getElementById(id + '_MODULE');
	if (!$link) return;
	document.head.removeChild($link);
	debug("Removing " + id + "_MODULE", "all");
}

ATscriptLoad(modulepath, 'utils');

function initializeAutoTrimps() {
	loadPageVariables();				//get autoTrimpSettings
	ATscriptLoad('','SettingsGUI');		//populate Settings GUI
	ATscriptLoad('','Graphs');			//populate Graphs
	AT_initializeConstants()
	let ATmoduleList = ['import-export', 'query', 'calc', 'portal', 'upgrades', 'heirlooms', 'buildings', 'jobs', 'equipment', 'gather', 'stance', 'maps', 'breedtimer', 'dynprestige', 'fight', 'scryer', 'magmite', 'nature', 'other', 'perks', 'fight-info', 'performance'];
	for (let m in ATmoduleList) {
		ATscriptLoad(modulepath, ATmoduleList[m]);
	}
	debug('AutoTrimps v' + ATversion + ' Loaded!', "all", "*spinner3");
}



var runInterval = 100;		//How often to loop through logic
var startupDelay = 2500;	//How long to wait for everything to load
var mainLoopInterval;
var guiLoopInterval;

setTimeout(delayStart, startupDelay);

function delayStart() {
	initializeAutoTrimps();
	//printChangelog();
	setTimeout(delayStartAgain, startupDelay);
}

function delayStartAgain(){
	game.global.addonUser = true;
	game.global.autotrimps = true;
	MODULESdefault = JSON.parse(JSON.stringify(MODULES));
	mainLoopInterval = setInterval(mainLoop, runInterval);
	guiLoopInterval = setInterval(guiLoop, runInterval*10);
}


//1.0.2		More imports
//1.0.3		Think I have Completly imported gather.js
//1.0.4		Importing buildings.js (50% done)
//1.0.5		Importing buildings.js (100% done)
//1.0.6		Importing upgrades.js
//1.0.7		Importing jobs.js
//1.0.8		Added Gymystic to upgrade array so it is calculate inside AT_scienceNeeded
//1.0.9		Bugfix
//1.0.10	Bugfix && removal of legacy code
//1.0.11	Bugfix && removal of legacy code



var ATversion = "1.0.11";
var ATrunning = true;
var ATmessageLogTabVisible = true;
var enableDebug = true;

var autoTrimpSettings = {};
var MODULES = {};
var MODULESdefault = {};
var ATMODULES = {};
var ATmoduleList = [];

var bestBuilding;
var RscienceNeeded;
var breedFire = false;

var shouldFarm = false;
var RshouldFarm = false;
var enoughDamage = true;
var RenoughDamage = true;
var enoughHealth = true;
var RenoughHealth = true;

var baseDamage = 0;
var baseBlock = 0;
var baseHealth = 0;

var preBuyAmt;
var preBuyFiring;
var preBuyTooltip;
var preBuymaxSplit;

var currentworld = 0;
var lastrunworld = 0;
var aWholeNewWorld = false;
var needGymystic = true;
var heirloomFlag = false;
var daily3 = false;
var heirloomCache = game.global.heirloomsExtra.length;
var magmiteSpenderChanged = false;
var lastHeliumZone = 0;
var lastRadonZone = 0;


var AT_Constants = {};
var AT_GlobalVars = {};


function mainLoop() {
	if (ATrunning == false) return;
	if (getPageSetting('PauseScript') || game.options.menu.pauseGame.enabled || game.global.viewingUpgrades) return;
	
	if (getPageSetting('showbreedtimer') == true) {
		if (game.options.menu.showFullBreed.enabled != 1) toggleSetting("showFullBreed");
		addbreedTimerInsideText.innerHTML = ((game.jobs.Amalgamator.owned > 0) ? Math.floor((new Date().getTime() - game.global.lastSoldierSentAt) / 1000) : Math.floor(game.global.lastBreedTime / 1000)) + 's'; //add breed time for next army;
		addToolTipToArmyCount();
	}
	if (mainCleanup() || portalWindowOpen || (!heirloomsShown && heirloomFlag) || (heirloomCache != game.global.heirloomsExtra.length)) {
		heirloomCache = game.global.heirloomsExtra.length;
	}
	heirloomFlag = heirloomsShown;
	if (aWholeNewWorld) {
		switch (document.getElementById('tipTitle').innerHTML) {
			case 'The Improbability':
			case 'Corruption':
			case 'Spire':
			case 'The Magma':
				cancelTooltip();
		}
		if (getPageSetting('AutoEggs'))
			easterEggClicked();
		setTitle();
	}

	//Logic for Universe 1
	if (game.global.universe == 1){

		//Offline Progress
		if (!usingRealTimeOffline) {
			autoLevelEquipment();
		}

		///////// Core //////////
		//Gather
		if (getPageSetting("ManualGather2") > 0) AT_gather();
		if (getPageSetting('TrapTrimps') && game.global.trapBuildAllowed && game.global.trapBuildToggled == false) toggleAutoTrap();
		//Buildings
		if (getPageSetting('BuyBuildingsNew') == 1) { AT_buyBuildings(); AT_buyStorage(); }
		else if (getPageSetting('BuyBuildingsNew') == 2) AT_buyBuildings();
		else if (getPageSetting('BuyBuildingsNew') == 3) AT_buyStorage();
		//Upgrades
		if (getPageSetting('BuyUpgradesNew') != 0) AT_buyUpgrades();
		//Jobs
		if (getPageSetting('BuyJobsNew') == 1) { AT_workerRatios(); AT_buyJobs(); }
		else if (getPageSetting('BuyJobsNew') == 2) AT_buyJobs();
		
		
		
		if (getPageSetting('AutoMaps') > 0 && game.global.mapsUnlocked) autoMap();
		if (getPageSetting('showautomapstatus') == true) updateAutoMapsStatus();
		if (getPageSetting('ATGA2') == true) ATGA2();
		if (aWholeNewWorld && getPageSetting('AutoRoboTrimp')) autoRoboTrimp();
		if (game.global.challengeActive == "Daily" && getPageSetting('buyheliumy') >= 1 && getDailyHeliumValue(countDailyWeight()) >= getPageSetting('buyheliumy') && game.global.b >= 100 && !game.singleRunBonuses.heliumy.owned) purchaseSingleRunBonus('heliumy');
		if (aWholeNewWorld && getPageSetting('FinishC2') > 0 && game.global.runningChallengeSquared) finishChallengeSquared();
		if (getPageSetting('spendmagmite') == 2 && !magmiteSpenderChanged) autoMagmiteSpender();
		if (getPageSetting('AutoNatureTokens') && game.global.world > 229) autoNatureTokens();
		if (getPageSetting('autoenlight') && game.global.world > 229 && game.global.uberNature == false) autoEnlight();
		

		if (getPageSetting('UseAutoGen') == true) autoGenerator();

		//Portal
		if (autoTrimpSettings.AutoPortal.selected != "Off" && game.global.challengeActive != "Daily" && !game.global.runningChallengeSquared) autoPortal();
		if (getPageSetting('AutoPortalDaily') > 0 && game.global.challengeActive == "Daily") dailyAutoPortal();
		if (getPageSetting('c2runnerstart') == true && getPageSetting('c2runnerportal') > 0 && game.global.runningChallengeSquared && getPageSetting('c2runnerportal')) c2runnerportal();
	
		//Combat
		if (getPageSetting('ForceAbandon') == true || getPageSetting('fuckanti') > 0) trimpcide();
		if (getPageSetting('trimpsnotdie') == true && game.global.world > 1) helptrimpsnotdie();
		if (!game.global.fighting) {
			if (getPageSetting('fightforever') == 0) fightalways();
			else if (getPageSetting('fightforever') > 0 && calcHDRatio() <= getPageSetting('fightforever')) fightalways();
			else if (getPageSetting('cfightforever') == true && (game.global.challengeActive == 'Electricty' || game.global.challengeActive == 'Toxicity' || game.global.challengeActive == 'Nom')) fightalways();
			else if (getPageSetting('dfightforever') == 1 && game.global.challengeActive == "Daily" && typeof game.global.dailyChallenge.empower == 'undefined' && typeof game.global.dailyChallenge.bloodthirst == 'undefined' && (typeof game.global.dailyChallenge.bogged !== 'undefined' || typeof game.global.dailyChallenge.plague !== 'undefined' || typeof game.global.dailyChallenge.pressure !== 'undefined')) fightalways();
			else if (getPageSetting('dfightforever') == 2 && game.global.challengeActive == "Daily" && (typeof game.global.dailyChallenge.bogged !== 'undefined' || typeof game.global.dailyChallenge.plague !== 'undefined' || typeof game.global.dailyChallenge.pressure !== 'undefined')) fightalways();
		}
		if (getPageSetting('BetterAutoFight') == 1) betterAutoFight();
		if (getPageSetting('BetterAutoFight') == 2) betterAutoFight3();
		var forcePrecZ = (getPageSetting('ForcePresZ') < 0) || (game.global.world < getPageSetting('ForcePresZ'));
		if (getPageSetting('DynamicPrestige2') > 0 && forcePrecZ) prestigeChanging2();
		else autoTrimpSettings.Prestige.selected = (document.getElementById('Prestige').value) ? document.getElementById('Prestige').value : "Daggader";
		if (game.global.world > 5 && game.global.challengeActive == "Daily" && getPageSetting('avoidempower') == true && typeof game.global.dailyChallenge.empower !== 'undefined' && !game.global.preMapsActive && !game.global.mapsActive && game.global.soldierHealth > 0) avoidempower();
		if (getPageSetting('buywepsvoid') == true && ((getPageSetting('VoidMaps') == game.global.world && game.global.challengeActive != "Daily") || (getPageSetting('DailyVoidMod') == game.global.world && game.global.challengeActive == "Daily")) && game.global.mapsActive && getCurrentMapObject().location == "Void") buyWeps();
		if ((getPageSetting('darmormagic') > 0 && typeof game.global.dailyChallenge.empower == 'undefined' && typeof game.global.dailyChallenge.bloodthirst == 'undefined' && (typeof game.global.dailyChallenge.bogged !== 'undefined' || typeof game.global.dailyChallenge.plague !== 'undefined' || typeof game.global.dailyChallenge.pressure !== 'undefined')) || (getPageSetting('carmormagic') > 0 && (game.global.challengeActive == 'Toxicity' || game.global.challengeActive == 'Nom'))) armormagic();
	
		//Stance
		if ((getPageSetting('UseScryerStance') == true) || (getPageSetting('scryvoidmaps') == true && game.global.challengeActive != "Daily") || (getPageSetting('dscryvoidmaps') == true && game.global.challengeActive == "Daily")) useScryerStance();
		else if ((getPageSetting('AutoStance') == 3) || (getPageSetting('use3daily') == true && game.global.challengeActive == "Daily")) windStance();
		else if (getPageSetting('AutoStance') == 1) autoStance();
		else if (getPageSetting('AutoStance') == 2) autoStance2();

		//Spire
		if (getPageSetting('ExitSpireCell') > 0 && game.global.challengeActive != "Daily" && getPageSetting('IgnoreSpiresUntil') <= game.global.world && game.global.spireActive) exitSpireCell();
		if (getPageSetting('dExitSpireCell') >= 1 && game.global.challengeActive == "Daily" && getPageSetting('dIgnoreSpiresUntil') <= game.global.world && game.global.spireActive) dailyexitSpireCell();
		if (getPageSetting('SpireBreedTimer') > 0 && getPageSetting('IgnoreSpiresUntil') <= game.global.world) ATspirebreed();
		if (getPageSetting('spireshitbuy') == true && (isActiveSpireAT() || disActiveSpireAT())) buyshitspire();

		//Raiding
		if ((getPageSetting('PraidHarder') == true && getPageSetting('Praidingzone').length > 0 && game.global.challengeActive != "Daily") || (getPageSetting('dPraidHarder') == true && getPageSetting('dPraidingzone').length > 0 && game.global.challengeActive == "Daily")) PraidHarder();
		else {
			if (getPageSetting('Praidingzone').length && game.global.challengeActive != "Daily") Praiding();
			if (getPageSetting('dPraidingzone').length && game.global.challengeActive == "Daily") dailyPraiding();
		}
		if (((getPageSetting('BWraid') && game.global.challengeActive != "Daily") || (getPageSetting('Dailybwraid') && game.global.challengeActive == "Daily"))) {
			BWraiding();
		}
		//if ((getPageSetting('BWraid') == true || getPageSetting('Dailybwraid') == true) && bwraidon) buyWeps();
		//if (game.global.mapsActive && getPageSetting('game.global.universe == 1 && BWraid') == true && game.global.world == getPageSetting('BWraidingz') && getCurrentMapObject().level <= getPageSetting('BWraidingmax')) buyWeps();

		//Golden
		var agu = getPageSetting('AutoGoldenUpgrades');
		var dagu = getPageSetting('dAutoGoldenUpgrades');
		var cagu = getPageSetting('cAutoGoldenUpgrades');
		if (agu && agu != 'Off' && (!game.global.runningChallengeSquared && game.global.challengeActive != "Daily")) autoGoldenUpgradesAT(agu);
		if (dagu && dagu != 'Off' && game.global.challengeActive == "Daily") autoGoldenUpgradesAT(dagu);
		if (cagu && cagu != 'Off' && game.global.runningChallengeSquared) autoGoldenUpgradesAT(cagu);
	}
	
	//Logic for Universe 2
	if (game.global.universe == 2){

		//Offline Progress
		if (!usingRealTimeOffline) {
			RsetScienceNeeded();
		}

	if (!(game.global.challengeActive == "Quest" && game.global.world > 5 && game.global.lastClearedCell < 90 && ([14, 24].indexOf(questcheck()) >= 0))) {
			if (getPageSetting('RBuyUpgradesNew') != 0) RbuyUpgrades();
	}

		//RCore
		if (getPageSetting('RAutoMaps') > 0 && game.global.mapsUnlocked) RautoMap();
		if (getPageSetting('Rshowautomapstatus') == true) RupdateAutoMapsStatus();
		if (getPageSetting('RManualGather2') == 1) RmanualLabor2();
		if (getPageSetting('RTrapTrimps') && game.global.trapBuildAllowed && game.global.trapBuildToggled == false) toggleAutoTrap();
		if (game.global.challengeActive == "Daily" && getPageSetting('buyradony') >= 1 && getDailyHeliumValue(countDailyWeight()) >= getPageSetting('buyradony') && game.global.b >= 100 && !game.singleRunBonuses.heliumy.owned) purchaseSingleRunBonus('heliumy');	
		
		//RBuildings
		
	var smithybought = 0;
		
	if (!(game.global.challengeActive == "Quest" && game.global.world > 5 && game.global.lastClearedCell < 90 && ([7, 10, 11, 12, 13, 20, 21, 22, 23].indexOf(questcheck()) >= 0))) {
			if (getPageSetting('RBuyBuildingsNew') == true) {
				RbuyBuildings();
		}
	}

	else if (game.global.challengeActive == "Quest" && game.global.world > 5 && questcheck() == 7) {
		if (smithybought <= 0 && !game.buildings.Smithy.locked && canAffordBuilding('Smithy') && game.global.challengeActive == "Quest" && ((questcheck() == 7) || (RcalcHDratio() * 10 >= getPageSetting('Rmapcuntoff')))) {
			buyBuilding("Smithy", true, true, 1);
			smithybought = game.global.world;
			}
			if (smithybought > 0 && game.global.world > smithybought && game.global.challengeActive == "Quest") {
			smithybought = 0;
			}
	}
		
		//RJobs
		if (!(game.global.challengeActive == "Quest" && game.global.world > 5) && getPageSetting('RBuyJobsNew') == 1) {
			RworkerRatios();
			RbuyJobs();
		} 
		else if (!(game.global.challengeActive == "Quest" && game.global.world > 5) && getPageSetting('RBuyJobsNew') == 2) { 
		RbuyJobs();
	}
	if (game.global.challengeActive == "Quest" && game.global.world > 5 && getPageSetting('RBuyJobsNew') > 0) {
		RquestbuyJobs();
	}

		//RPortal
		if (autoTrimpSettings.RAutoPortal.selected != "Off" && game.global.challengeActive != "Daily" && !game.global.runningChallengeSquared) RautoPortal();
		if (getPageSetting('RAutoPortalDaily') > 0 && game.global.challengeActive == "Daily") RdailyAutoPortal();

	//RChallenges
	if (getPageSetting('Rarchon') == true && game.global.challengeActive == "Archaeology") {
		archstring();
	}
	
		//RCombat
	if (getPageSetting('Requipon') == true && (!(game.global.challengeActive == "Quest" && game.global.world > 5 && game.global.lastClearedCell < 90 && ([11, 12, 21, 22].indexOf(questcheck()) >= 0)))) RautoEquip();
		if (getPageSetting('BetterAutoFight') == 1) betterAutoFight();
		if (getPageSetting('BetterAutoFight') == 2) betterAutoFight3();
		if (game.global.world > 5 && game.global.challengeActive == "Daily" && getPageSetting('Ravoidempower') == true && typeof game.global.dailyChallenge.empower !== 'undefined' && !game.global.preMapsActive && !game.global.mapsActive && game.global.soldierHealth > 0) avoidempower();
		if (!game.global.fighting) {
		if (getPageSetting('Rfightforever') == 0) Rfightalways();
			else if (getPageSetting('Rfightforever') > 0 && RcalcHDratio() <= getPageSetting('Rfightforever')) Rfightalways();
			else if (getPageSetting('Rdfightforever') == 1 && game.global.challengeActive == "Daily" && typeof game.global.dailyChallenge.empower == 'undefined' && typeof game.global.dailyChallenge.bloodthirst == 'undefined' && (typeof game.global.dailyChallenge.bogged !== 'undefined' || typeof game.global.dailyChallenge.plague !== 'undefined' || typeof game.global.dailyChallenge.pressure !== 'undefined')) Rfightalways();
			else if (getPageSetting('Rdfightforever') == 2 && game.global.challengeActive == "Daily" && (typeof game.global.dailyChallenge.bogged !== 'undefined' || typeof game.global.dailyChallenge.plague !== 'undefined' || typeof game.global.dailyChallenge.pressure !== 'undefined')) Rfightalways();
		}
		if ((getPageSetting('Rdarmormagic') > 0 && typeof game.global.dailyChallenge.empower == 'undefined' && typeof game.global.dailyChallenge.bloodthirst == 'undefined' && (typeof game.global.dailyChallenge.bogged !== 'undefined' || typeof game.global.dailyChallenge.plague !== 'undefined' || typeof game.global.dailyChallenge.pressure !== 'undefined')) || (getPageSetting('Rcarmormagic') > 0 && (game.global.challengeActive == 'Toxicity' || game.global.challengeActive == 'Nom'))) Rarmormagic();
	if (getPageSetting('Rmanageequality') == true && game.global.fighting) Rmanageequality();

		//RRaiding
		if ((getPageSetting('RPraidHarder') == true && getPageSetting('RPraidingzone').length > 0 && game.global.challengeActive != "Daily") || (getPageSetting('RdPraidHarder') == true && getPageSetting('RdPraidingzone').length > 0 && game.global.challengeActive == "Daily")) RPraidHarder();
		else {
			if (getPageSetting('RPraidingzone').length && game.global.challengeActive != "Daily") RPraiding();
			if (getPageSetting('RdPraidingzone').length && game.global.challengeActive == "Daily") RdailyPraiding();
		}
		if (((getPageSetting('RBWraid') && game.global.challengeActive != "Daily") || (getPageSetting('RDailybwraid') && game.global.challengeActive == "Daily"))) {
		RBWraiding()
		}
		if ((getPageSetting('RBWraid') == true || getPageSetting('RDailybwraid') == true) && Rbwraidon) RbuyWeps();
		if (game.global.mapsActive && getPageSetting('RBWraid') == true && game.global.world == getPageSetting('RBWraidingz') && getCurrentMapObject().level <= getPageSetting('RBWraidingmax')) RbuyWeps();
	
	//RHeirlooms
	if (getPageSetting('Rhs') == true) {
		Rheirloomswap();
	}
		
		//RGolden
		var Ragu = getPageSetting('RAutoGoldenUpgrades');
		var Rdagu = getPageSetting('RdAutoGoldenUpgrades');
		var Rcagu = getPageSetting('RcAutoGoldenUpgrades');
		if (Ragu && Ragu != 'Off' && (!game.global.runningChallengeSquared && game.global.challengeActive != "Daily")) RautoGoldenUpgradesAT(Ragu);
		if (Rdagu && Rdagu != 'Off' && game.global.challengeActive == "Daily") RautoGoldenUpgradesAT(Rdagu);
		if (Rcagu && Rcagu != 'Off' && game.global.runningChallengeSquared) RautoGoldenUpgradesAT(Rcagu);
	}
}

function guiLoop(){updateCustomButtons(),safeSetItems('storedMODULES',JSON.stringify(compareModuleVars())),getPageSetting('EnhanceGrids')&&MODULES.fightinfo.Update(),'undefined'!=typeof MODULES&&'undefined'!=typeof MODULES.performance&&MODULES.performance.isAFK&&MODULES.performance.UpdateAFKOverlay()}
function mainCleanup() {
	lastrunworld = currentworld;
	currentworld = game.global.world;
	aWholeNewWorld = lastrunworld != currentworld;
	if (game.global.universe == 1 && currentworld == 1 && aWholeNewWorld) {
		lastHeliumZone = 0;
		zonePostpone = 0;
		if (getPageSetting('automapsportal') == true && getPageSetting('AutoMaps')==0 && !game.upgrades.Battle.done)
			autoTrimpSettings["AutoMaps"].value = 1;
		return true;
	}
	if (game.global.universe == 2 && currentworld == 1 && aWholeNewWorld) {
		lastRadonZone = 0;
		zonePostpone = 0;
		if (getPageSetting('Rautomapsportal') == true && getPageSetting('RAutoMaps') == 0 && !game.upgrades.Battle.done)
			autoTrimpSettings["RAutoMaps"].value = 1;
		return true;
	}
}
function throwErrorfromMain(){throw new Error("We have successfully read the thrown error message out of the main file")}
