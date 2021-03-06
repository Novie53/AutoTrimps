MODULES["jobs"] = {};
MODULES.jobs.scientistRatio = 25;		//ratio for scientists. (totalRatios / this)
MODULES.jobs.scientistRatio2 = 10;	   //used for lowlevel and Watch challenge
MODULES.jobs.magmamancerRatio = 0.1;	 //buys 10% of your gem resources
//Worker Ratios = [Farmer,Lumber,Miner]
MODULES.jobs.autoRatio6 = [1,12,12];
MODULES.jobs.autoRatio5 = [1,2,22];
MODULES.jobs.autoRatio4 = [1,1,10];
MODULES.jobs.autoRatio3 = [3,1,4];
MODULES.jobs.autoRatio2 = [3,3,5];
MODULES.jobs.autoRatio1 = [1,1,1];
MODULES.jobs.customRatio;

var tierMagmamancers = 0;


//positive amounts will buy and negative amounts will fire jobs
//allowAutoFire will fire a farmer to make room if needed. Used for Scientist, Trainer and Explorer;
function AT_safeBuyFireJob (jobName, amount, allowAutoFire) {
	if (!Number.isInteger(amount)) {
		throw "Error, not valid amount input: \"" + amount + "\"";
	}
	if (amount === 0 || !(jobName in game.jobs) || game.jobs[jobName].locked) { return; }
	
	let old = preBuy2();
	if (amount < 0) {
		amount = Math.abs(amount);
		AT__FireJob(jobName, amount);
	}
	else {
		AT__BuyJob(jobName, amount, allowAutoFire)
	}	
	postBuy2(old);
}

function AT__FireJob(jobName, amount) {
	let debug_TrimpsBefore = game.jobs[jobName].owned;
	let debug_WorkspacesBefore = game.workspaces;
	
	
	amount = Math.min(amount, game.jobs[jobName].owned);
	if (amount >= 1) {
		game.global.firing = true;
		game.global.buyAmt = amount;
		debug("Firing " + prettify(amount) + ' ' + jobName + (amount > 1 ? "s" : ""), "jobs", "*users");
		buyJob(jobName, true, true);
	
	
		if ((debug_TrimpsBefore - amount) != game.jobs[jobName].owned) {
			console.log("Error, Should not happen - jobs.js");
			toggleSetting('pauseGame');
			debugger
		}
		if ((debug_WorkspacesBefore + amount) != game.workspaces) {
			console.log("Error, Should not happen - jobs.js");
			toggleSetting('pauseGame');
			debugger
		}
	}
	
	/*
	let oldjob = game.jobs[job].owned;
	if (oldjob == 0 || amount == 0)
		return 0;
	let test = oldjob;
	let x = 1;
	if (amount != null)
		x = amount;
	if (!Number.isFinite(oldjob)) {
		while (oldjob == test) {
			test -= x;
			x *= 2;
		}
	}
	let old = preBuy2();
	game.global.firing = true;
	let freeWorkers = Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed;
	while (x >= 1 && freeWorkers == Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed) {
		game.global.buyAmt = x;
		buyJob(job, true, true);
		x *= 2;
	}
	postBuy2(old);
	return x / 2;
	*/
}

function AT__BuyJob(jobName, amount, allowAutoFire) {
	let canAfford = AT_canAffordJob(jobName, amount);
	if (!canAfford) {
		amount = calculateMaxAfford(game.jobs[jobName], false, false, true);
		canAfford = AT_canAffordJob(jobName, amount);
		if (!canAfford) return false;
	}
	
	let missingWorkers = amount - game.workspaces;
	if (missingWorkers > 0 && allowAutoFire)
		AT__FireJob("Farmer", missingWorkers);
	else if (missingWorkers > 0)
		amount -= missingWorkers;
	
	
	
	
	let debug_TrimpsBefore = game.jobs[jobName].owned;
	let debug_WorkspacesBefore = game.workspaces;
	
	if (amount >= 1) {
		game.global.firing = false;
		game.global.buyAmt = amount;
		debug("Hiring " + prettify(game.global.buyAmt) + ' ' + jobName + (amount > 1 ? "s" : ""), "jobs", "*users");
		buyJob(jobName, true, true);
	
		if ((debug_TrimpsBefore + game.global.buyAmt) != game.jobs[jobName].owned) {
			console.log("Error, Should not happen - jobs.js");
			toggleSetting('pauseGame');
			debugger
		}
		if ((debug_WorkspacesBefore - game.global.buyAmt) != game.workspaces) {
			console.log("Error, Should not happen - jobs.js");
			toggleSetting('pauseGame');
			debugger
		}
	}
}

function AT_workerRatios() {
	let ratioSet;
	if (MODULES["jobs"].customRatio) {
		ratioSet = MODULES["jobs"].customRatio;
	} else if (game.buildings.Tribute.owned > 3000 && mutations.Magma.active()) {
		ratioSet = MODULES["jobs"].autoRatio6;
	} else if (game.buildings.Tribute.owned > 1500) {
		ratioSet = MODULES["jobs"].autoRatio5;
	} else if (game.buildings.Tribute.owned > 1000) {
		ratioSet = MODULES["jobs"].autoRatio4;
	} else if (game.resources.trimps.realMax() > 3000000) {
		ratioSet = MODULES["jobs"].autoRatio3;
	} else if (game.resources.trimps.realMax() > 300000) {
		ratioSet = MODULES["jobs"].autoRatio2;
	} else {
		ratioSet = MODULES["jobs"].autoRatio1;
	}
	/* //Override normal ratios with challenge specific ones
	if (game.global.challengeActive == 'Watch'){
		ratioSet = MODULES["jobs"].autoRatio1;
	} */
	//Install the new ratios into active settings
	setPageSetting('FarmerRatio',ratioSet[0]);
	setPageSetting('LumberjackRatio',ratioSet[1]);
	setPageSetting('MinerRatio',ratioSet[2]);
}

function AT_buyJobs_MainThree() {
	let mainJobRatio = [
		["Farmer", !game.jobs["Farmer"].locked ? parseInt(getPageSetting("FarmerRatio")) : 0],
		["Lumberjack", !game.jobs["Lumberjack"].locked ? parseInt(getPageSetting("LumberjackRatio")) : 0],
		["Miner", !game.jobs["Miner"].locked ? parseInt(getPageSetting("MinerRatio")) : 0]	
	]
	let totalRatio = mainJobRatio[0][1] + mainJobRatio[1][1] + mainJobRatio[2][1];

	for (let i in mainJobRatio) {
		let jobName = mainJobRatio[i][0];
		if (game.jobs[jobName].locked) continue;
		
		let freeWorkers = Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed;
		let totalDistributableWorkers = freeWorkers + game.jobs.Farmer.owned + game.jobs.Miner.owned + game.jobs.Lumberjack.owned;
		let toBuy = Math.floor((mainJobRatio[i][1] / totalRatio) * totalDistributableWorkers) - game.jobs[jobName].owned;
		if (toBuy != 0) {
			AT_safeBuyFireJob(jobName, toBuy, false);
		}
	}
}

function AT_buyJobs_LessThree() {
	if (!game.jobs.Scientist.locked) {
		let freeWorkers = Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed;
		let totalDistributableWorkers = freeWorkers + game.jobs.Farmer.owned + game.jobs.Miner.owned + game.jobs.Lumberjack.owned;
		let totalRatio = !game.jobs["Farmer"].locked ? parseInt(getPageSetting("FarmerRatio")) : 0 + 
						 !game.jobs["Lumberjack"].locked ? parseInt(getPageSetting("LumberjackRatio")) : 0 + 
						 !game.jobs["Miner"].locked ? parseInt(getPageSetting("MinerRatio")) : 0;
		let scientistRatio = game.jobs.Farmer.owned < 100 ? totalRatio / MODULES["jobs"].scientistRatio2 : totalRatio / MODULES["jobs"].scientistRatio;
		let toBuy = Math.floor((scientistRatio / totalRatio) * totalDistributableWorkers) - game.jobs.Scientist.owned;
		if (toBuy > 0) {
			if (getPageSetting('MaxScientists') != -1) {
				toBuy = Math.min(toBuy, Math.max(getPageSetting('MaxScientists') - game.jobs.Scientist.owned, 0));
			}
			AT_safeBuyFireJob("Scientist", toBuy, true);
		}
	}
	
	if (!game.jobs.Trainer.locked && (getPageSetting('MaxTrainers') > game.jobs.Trainer.owned || getPageSetting('MaxTrainers') == -1)) {
		AT_safeBuyFireJob('Trainer', 1, true);
	}
	
	if (!game.jobs.Explorer.locked && (getPageSetting('MaxExplorers') > game.jobs.Explorer.owned || getPageSetting('MaxExplorers') == -1)) {
		AT_safeBuyFireJob('Explorer', 1, true);
	}
}

function AT_buyMagmaMancer() {
	if (game.jobs.Magmamancer.locked || game.jobs.Magmamancer.getBonusPercent(true) <= 1) return;
	
	let toBuy = calculateMaxAfford(game.jobs["Magmamancer"], false, false, true, false, MODULES.jobs.magmamancerRatio)
	if (toBuy > 0) {
		AT_safeBuyFireJob("Magmamancer", toBuy, true);
	}
}

function AT_buyJobs() {
	if (game.resources.trimps.owned / game.resources.trimps.realMax() < 0.9) return;
	// if (game.global.challengeActive == "Watch") return;
	
	AT_buyJobs_LessThree(); //Scientist, Trainers, Explorers
	AT_buyJobs_MainThree(); //Farmer, Lumberjack, Miner
	AT_buyMagmaMancer(); 
}





/* 
function AT_buyMagmaMancer() {
	if (game.jobs.Magmamancer.locked) return;
	debugger
	
	//game.jobs.Magmamancer.getBonusPercent(true);
	let timeOnZone = Math.floor((new Date().getTime() - game.global.zoneStarted) / 60000);
	// Add 5 minutes for zone-time for magmamancer mastery
	if (game.talents.magmamancer.purchased)
		timeOnZone += 5;
	let stacks2 = Math.floor(timeOnZone / 10);
	if (getPageSetting('AutoMagmamancers') && stacks2 > tierMagmamancers) {
		let old = preBuy2();
		game.global.firing = false;
		game.global.buyAmt = 'Max';
		game.global.maxSplit = MODULES["jobs"].magmamancerRatio;	// (10%)
		
		let firesomedudes = calculateMaxAfford(game.jobs['Magmamancer'], false, false, true);
		//fire (10x) as many workers as we need so "Max" (0.1) can work, because FreeWorkers are considered as part of the (10%) calc
		let inverse = (1 /  MODULES["jobs"].magmamancerRatio);
		firesomedudes *= inverse;

		if (game.jobs.Farmer.owned > firesomedudes)
			fireJobs('Farmer', firesomedudes);
		else if (game.jobs.Lumberjack.owned > firesomedudes)
			fireJobs('Lumberjack', firesomedudes);
		else if (game.jobs.Miner.owned > firesomedudes)
			fireJobs('Miner', firesomedudes);
		//buy the Magmamancers
		game.global.firing = false;
		game.global.buyAmt = 'Max';
		game.global.maxSplit = MODULES["jobs"].magmamancerRatio;
		buyJob('Magmamancer', true, true);
		postBuy2(old);
		debug("Bought " + (firesomedudes/inverse) + ' Magmamancers. Total Owned: ' + game.jobs['Magmamancer'].owned, "magmite", "*users");
		tierMagmamancers += 1;
	}
	else if (stacks2 < tierMagmamancers) {
		tierMagmamancers = 0;
	}
	
}


 */






//Radon

MODULES["jobs"].RscientistRatio = 8;
MODULES["jobs"].RscientistRatio2 = 4;
MODULES["jobs"].RscientistRatio3 = 16;
MODULES["jobs"].RscientistRatio4 = 64;
//Worker Ratios = [Farmer,Lumber,Miner]
MODULES["jobs"].RautoRatio7 = [1, 1, 98];
MODULES["jobs"].RautoRatio6 = [1, 7, 12];
MODULES["jobs"].RautoRatio5 = [1, 2, 22];
MODULES["jobs"].RautoRatio4 = [1, 1.1, 10];
MODULES["jobs"].RautoRatio3 = [3, 1, 4];
MODULES["jobs"].RautoRatio2 = [3, 3.1, 5];
MODULES["jobs"].RautoRatio1 = [1.1, 1.15, 1.2];
MODULES["jobs"].RcustomRatio;

function RsafeBuyJob(jobTitle, amount) {
    if (!Number.isFinite(amount) || amount === 0 || typeof amount === 'undefined' || Number.isNaN(amount)) {
        return false;
    }
    var old = preBuy2();
    var freeWorkers = Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed;
    var result;
    if (amount < 0) {
        amount = Math.abs(amount);
        game.global.firing = true;
        game.global.buyAmt = amount;
        result = true;
    } else {
        game.global.firing = false;
        game.global.buyAmt = amount;
        result = canAffordJob(jobTitle, false) && freeWorkers > 0;
        if (!result) {
            game.global.buyAmt = 'Max';
            game.global.maxSplit = 1;
            result = canAffordJob(jobTitle, false) && freeWorkers > 0;
        }
    }
    if (result) {
        debug((game.global.firing ? 'Firing ' : 'Hiring ') + prettify(game.global.buyAmt) + ' ' + jobTitle + 's', "jobs", "*users");
        buyJob(jobTitle, true, true);
    }
    postBuy2(old);
    return true;
}

function RsafeFireJob(job, amount) {
    var oldjob = game.jobs[job].owned;
    if (oldjob == 0 || amount == 0)
        return 0;
    var test = oldjob;
    var x = 1;
    if (amount != null)
        x = amount;
    if (!Number.isFinite(oldjob)) {
        while (oldjob == test) {
            test -= x;
            x *= 2;
        }
    }
    var old = preBuy2();
    game.global.firing = true;
    var freeWorkers = Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed;
    while (x >= 1 && freeWorkers == Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed) {
        game.global.buyAmt = x;
        buyJob(job, true, true);
        x *= 2;
    }
    postBuy2(old);
    return x / 2;
}

function RworkerRatios() {
    var ratioSet;
    if (MODULES["jobs"].RcustomRatio) {
        ratioSet = MODULES["jobs"].RcustomRatio;
    } else if (game.global.world >= 300) {
        ratioSet = MODULES["jobs"].RautoRatio7;
    } else if (game.buildings.Tribute.owned > 3000 && mutations.Magma.active()) {
        ratioSet = MODULES["jobs"].RautoRatio6;
    } else if (game.buildings.Tribute.owned > 1500) {
        ratioSet = MODULES["jobs"].RautoRatio5;
    } else if (game.buildings.Tribute.owned > 1000) {
        ratioSet = MODULES["jobs"].RautoRatio4;
    } else if (game.resources.trimps.realMax() > 3000000) {
        ratioSet = MODULES["jobs"].RautoRatio3;
    } else if (game.resources.trimps.realMax() > 300000) {
        ratioSet = MODULES["jobs"].RautoRatio2;
    } else if (game.global.challengeActive == 'Transmute') {
        ratioSet = [4, 5, 0];
    } else {
        ratioSet = MODULES["jobs"].RautoRatio1;
    }
    setPageSetting('RFarmerRatio', ratioSet[0]);
    setPageSetting('RLumberjackRatio', ratioSet[1]);
    setPageSetting('RMinerRatio', ratioSet[2]);
}

function RquestbuyJobs() {
	
    var freeWorkers = Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed;
    var totalDistributableWorkers = freeWorkers + game.jobs.Farmer.owned + game.jobs.Miner.owned + game.jobs.Lumberjack.owned;

    var farmerRatio = 0;
    var lumberjackRatio = 0;
    var minerRatio = 0;
    var scientistNumber = (totalDistributableWorkers * 0.00001);
    if (scientistNumber <= 0) {
	scientistNumber = 1;
    }
	
    if (game.global.world > 5) {
	if (questcheck() == 7 && !canAffordBuilding('Smithy')) {
	    farmerRatio = 10;
	    lumberjackRatio = 10;
	    minerRatio = 10;
	}
	if (questcheck() == 10 || questcheck() == 20) {
            farmerRatio = 10;
        }
        if (questcheck() == 11 || questcheck() == 21) {
            lumberjackRatio = 10;
        }
        if (questcheck() == 12 || questcheck() == 22) {
            minerRatio = 10;
        }
	if (questcheck() == 14 || questcheck() == 24) {
	    scientistNumber = (totalDistributableWorkers * 0.5);
	}
    }

    freeWorkers = Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed;
    totalDistributableWorkers = freeWorkers + game.jobs.Farmer.owned + game.jobs.Miner.owned + game.jobs.Lumberjack.owned;
	
    if (scientistNumber > (totalDistributableWorkers * 0.00001) && !game.jobs.Scientist.locked) {
        if (freeWorkers > 0 && scientistNumber > game.jobs.Scientist.owned) {
            var n = scientistNumber - game.jobs.Scientist.owned;
            RsafeBuyJob('Scientist', n);
        }
    }
    else if (game.jobs.Scientist.owned > scientistNumber && !game.jobs.Scientist.locked) {
	var n = game.jobs.Scientist.owned - scientistNumber;
	RsafeFireJob('Scientist', n);
    }
	
    if (getPageSetting('RMaxExplorers') > game.jobs.Explorer.owned || getPageSetting('RMaxExplorers') == -1) {
        RsafeBuyJob("Explorer", 1);
    }
	
    freeWorkers = Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed;
    totalDistributableWorkers = freeWorkers + game.jobs.Farmer.owned + game.jobs.Miner.owned + game.jobs.Lumberjack.owned;
	
    var farmerkeep = totalDistributableWorkers * 0.01;
    if (farmerkeep < 1) {
	farmerkeep = 100;
	if (totalDistributableWorkers <= 100) {
	    farmerkeep = 1;
	}
    }

    totalDistributableWorkers = totalDistributableWorkers - farmerkeep;
	
    if (farmerRatio > 0 && lumberjackRatio <= 0 && minerRatio <= 0) {
	RsafeFireJob('Lumberjack', game.jobs.Lumberjack.owned);
	RsafeFireJob('Miner', game.jobs.Miner.owned);
	RsafeBuyJob('Farmer', totalDistributableWorkers);
    }
	
    else if (lumberjackRatio > 0 && farmerRatio <= 0 && minerRatio <= 0) {
	RsafeFireJob('Farmer', game.jobs.Farmer.owned - farmerkeep);
	RsafeFireJob('Miner', game.jobs.Miner.owned);
	RsafeBuyJob('Lumberjack', totalDistributableWorkers);
    }
	
    else if (minerRatio > 0 && farmerRatio <= 0 && lumberjackRatio <= 0) {
	RsafeFireJob('Farmer', game.jobs.Farmer.owned - farmerkeep);
	RsafeFireJob('Lumberjack', game.jobs.Lumberjack.owned);
	RsafeBuyJob('Miner', totalDistributableWorkers);
    }

    else if (farmerRatio <= 0 && lumberjackRatio <= 0 && minerRatio <= 0) {
	RsafeFireJob('Farmer', game.jobs.Farmer.owned - farmerkeep);
	RsafeFireJob('Lumberjack', game.jobs.Lumberjack.owned);
	RsafeFireJob('Miner', game.jobs.Miner.owned);
    }

    else if (farmerRatio > 0 && lumberjackRatio > 0 && minerRatio > 0) {
	RsafeBuyJob('Farmer', totalDistributableWorkers * 0.15);
	RsafeBuyJob('Lumberjack', totalDistributableWorkers * 0.35);
	RsafeBuyJob('Miner', totalDistributableWorkers * 0.45);
    }
}

var reservedJobs = 100;

function RbuyJobs() {

    if (game.jobs.Farmer.locked || game.resources.trimps.owned == 0) return;

    var freeWorkers = Math.ceil(Math.min(game.resources.trimps.realMax() / 2), game.resources.trimps.owned) - game.resources.trimps.employed;
    if (freeWorkers <= 0) return;

    // Do non-ratio/limited jobs first
    // Explorers
    var maxExplorers = (getPageSetting('RMaxExplorers') == -1) ? Infinity : getPageSetting('RMaxExplorers');
    if (maxExplorers > game.jobs.Explorer.owned && !game.jobs.Explorer.locked) {
        var affordableExplorers = Math.min(maxExplorers - game.jobs.Explorer.owned,
            getMaxAffordable(
                game.jobs.Explorer.cost.food[0] * Math.pow(game.jobs.Explorer.cost.food[1], game.jobs.Explorer.owned),
                game.resources.food.owned,
                game.jobs.Explorer.cost.food[1],
                true
            )
        );

        if (affordableExplorers > 0) {
            var buyAmountStore = game.global.buyAmt;
            game.global.buyAmt = affordableExplorers;

            buyJob('Explorer',true, true);
            
            freeWorkers -= affordableExplorers;
            game.global.buyAmt = buyAmountStore;
        }
    }

    // Meteorologists
    var affordableMets = getMaxAffordable(
        game.jobs.Meteorologist.cost.food[0] * Math.pow(game.jobs.Meteorologist.cost.food[1], game.jobs.Meteorologist.owned),
        game.resources.food.owned,
        game.jobs.Meteorologist.cost.food[1],
        true
    );

    if (affordableMets > 0 && !game.jobs.Meteorologist.locked) {
        var buyAmountStore = game.global.buyAmt;
        game.global.buyAmt = affordableMets;

        buyJob('Meteorologist',true, true);
        
        freeWorkers -= affordableMets;
        game.global.buyAmt = buyAmountStore;
    }

    // Ships
    var affordableShips = Math.floor(game.resources.food.owned / game.jobs.Worshipper.getCost());
    if (affordableShips > 0 && !game.jobs.Worshipper.locked) {
        var buyAmountStore = game.global.buyAmt;
        game.global.buyAmt = affordableShips;

        buyJob('Worshipper',true, true);
        
        freeWorkers -= affordableShips;
        game.global.buyAmt = buyAmountStore;
    }

    // Gather up the total number of workers available to be distributed across ratio workers
    // In the process store how much of each for later.
    var ratioWorkers = ['Farmer', 'Lumberjack', 'Miner', 'Scientist'];
    var currentworkers = [];
    for (var worker of ratioWorkers) {
        currentworkers.push(game.jobs[worker].owned);
    }

    freeWorkers += currentworkers.reduce((a,b) => {return a + b;});
	
    freeWorkers -= (game.resources.trimps.owned > 1e6) ? reservedJobs : 0;

    // Calculate how much of each worker we should have
    // If focused farming go all in for caches
    var allIn = "";
    if (Rshouldtimefarmbogs || Rshouldtimefarm) {
        if (autoTrimpSettings.Rtimespecialselection.selected.includes('wc')) {
            allIn = "Lumberjack";
        } else if (autoTrimpSettings.Rtimespecialselection.selected.includes('sc')) {
            allIn = "Farmer";
        } else if (autoTrimpSettings.Rtimespecialselection.selected.includes('mc')) {
            allIn = "Miner";
        } else if (autoTrimpSettings.Rtimespecialselection.selected.includes('rc')) {
            allIn = "Scientist";
        }
    }
    if (Rshouldshipfarm) {
	allIn = "Farmer";
    }
    var desiredRatios = [0,0,0,0];
    if (allIn != "") {
        desiredRatios[ratioWorkers.indexOf(allIn)] = 1;
    } else {
        // Weird scientist ratio hack. Based on previous AJ, I don't know why it's like this.
        var scientistMod = MODULES["jobs"].RscientistRatio;
        if (game.jobs.Farmer.owned < 100) {
            scientistMod = MODULES["jobs"].RscientistRatio2;
        }
        if (game.global.world >= 50) {
            scientistMod = MODULES["jobs"].RscientistRatio3;
        }
        if (game.global.world >= 65) {
            scientistMod = MODULES["jobs"].RscientistRatio4;
        }

        for (var worker of ratioWorkers) {
            if (!game.jobs[worker].locked) {

                if (worker == "Scientist"){
                    desiredRatios[ratioWorkers.indexOf(worker)] = 1;
                    continue;
                }

                // get ratio from AT
                desiredRatios[ratioWorkers.indexOf(worker)] = scientistMod * parseFloat(getPageSetting('R' + worker + 'Ratio'));
            }
        }
    }

    var totalFraction = desiredRatios.reduce((a,b) => {return a + b;});

    var desiredWorkers = [0,0,0,0];
    var totalWorkerCost = 0;
    for (var i = 0; i < ratioWorkers.length; i++) {
        desiredWorkers[i] = Math.floor(freeWorkers * desiredRatios[i] / totalFraction - currentworkers[i]);
        if (desiredWorkers[i] > 0) totalWorkerCost += game.jobs[ratioWorkers[i]].cost.food * desiredWorkers[i];
    }
    // Check for negative values, in case we need to fire.

    // Safe check total worker costs, almost never going to be an issue
    // Or another reason that we're unable to buy everything we want
    if (totalWorkerCost > game.resources.food.owned /* or breeding/available stuff */) {
        // Buy max on food and then let the next frame take care of the rest.
        var buyAmountStore = game.global.buyAmt;
        game.global.buyAmt = "Max";

        buyJob('Farmer', true, true);

        game.global.buyAmt = buyAmountStore;
    } else {
        //buy everything
        for (var i = 0; i < desiredWorkers.length; i++) {

            if (desiredWorkers[i] == 0) continue;

            var buyAmountStore = game.global.buyAmt;
            var fireState = game.global.firing;

            game.global.firing = (desiredWorkers[i] < 0);
            game.global.buyAmt = Math.abs(desiredWorkers[i]);

            buyJob(ratioWorkers[i], true, true);

            game.global.firing = fireState;
            game.global.buyAmt = buyAmountStore;
        }
    }
}
