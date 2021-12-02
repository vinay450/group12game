var game = new Phaser.Game(1703, 800,Phaser.AUTO, '');

game.state.add('over', {
    create: function() {
        this.gameOverText = this.add.text(30, 50, 'Game Over', {
            font: '120px Arial Black',
            fill: '#fff',
            strokeThickness: 4
        });
        this.directionsText = this.add.text(100, 200, 'Please refresh the\n webpage to try again.', {
            font: '40px Arial Black',
            fill: '#fff',
            strokeThickness: 4
        });
    } 
});
game.state.add('win', {
    create: function() {
        this.gameOverText = this.add.text(30, 50, 'Congratulations', {
            font: '120px Arial Black',
            fill: '#fff',
            strokeThickness: 4
        });
        this.directionsText = this.add.text(100, 200, 'You won the\n game!', {
            font: '40px Arial Black',
            fill: '#fff',
            strokeThickness: 4
        });
    } 
});
game.state.add('play', {
    preload: function() {
        this.game.load.image('forest-center-1', 'assets/backgrounds/battleback1.png');
        this.game.load.image('turtle', 'assets/aekashicsSprites/Boss Continental Turtle Rukkha.png');
        this.game.load.image('dryad', 'assets/aekashicsSprites/Boss Dryad Queen Rafflesia.png');
        this.game.load.image('mantis', 'assets/aekashicsSprites/Insects Sickle Mantis.png');
        this.game.load.image('mandrake', 'assets/aekashicsSprites/Plant Warriors Screamer Mandrake.png');
        this.game.load.image('slime', 'assets/aekashicsSprites/Slime Windi.png');
        this.game.load.image('cactus', 'assets/aekashicsSprites/Toxic Cactus C.png');
        this.game.load.image('plant', 'assets/aekashicsSprites/Toxic Carnivorous Plant C.png');
        this.game.load.image('shroom', 'assets/aekashicsSprites/Toxic Shroom C.png');
        this.game.load.image('fairy', 'assets/aekashicsSprites/Wind Fairy.png');
        this.game.load.image('snake', 'assets/aekashicsSprites/Wind Snake.png');
        this.game.load.image('gold_coin', 'assets/496_RPG_icons/I_GoldCoin.png');
        this.game.load.image('person', 'assets/496_RPG_icons/S_Buff01.png');
        this.game.load.image('sword', 'assets/496_RPG_icons/W_Sword002.png');

        // build panel for upgrades
        var bmd = this.game.add.bitmapData(240, 110);
        bmd.ctx.fillStyle = '#9a783d';
        bmd.ctx.strokeStyle = '#35371c';
        bmd.ctx.lineWidth = 10;
        bmd.ctx.fillRect(0, 0, 250, 500);
        bmd.ctx.strokeRect(0, 0, 250, 500);
        this.game.cache.addBitmapData('upgradePanel', bmd);

        var buttonImage = this.game.add.bitmapData(476, 48);
        buttonImage.ctx.fillStyle = '#e6dec7';
        buttonImage.ctx.strokeStyle = '#35371c';
        buttonImage.ctx.lineWidth = 4;
        buttonImage.ctx.fillRect(0, 0, 225, 48);
        buttonImage.ctx.strokeRect(0, 0, 225, 48);
        this.game.cache.addBitmapData('button', buttonImage);

        // the main player
        this.player = {
            clickDmg: 1,
            gold: 50,
            dps: 0,
            time: 600
        };

        // world progression
        this.level = 1;
        // how many monsters have we killed during this level
        this.levelKills = 0;
        // how many monsters are required to advance a level
        this.levelKillsRequired = 1;
    },
    create: function() {
        var state = this;
        this.background = this.game.add.group();
        // setup each of our background layers to take the full screen
        ['forest-center-1']
            .forEach(function(image) {
                var bg = state.game.add.tileSprite(0, 0, state.game.world.width,
                    state.game.world.height, image, '', state.background);
                bg.tileScale.setTo(4,4);
            });

        this.upgradePanel = this.game.add.image(10, 70, this.game.cache.getBitmapData('upgradePanel'));
        var upgradeButtons = this.upgradePanel.addChild(this.game.add.group());
        upgradeButtons.position.setTo(8, 8);

        var upgradeButtonsData = [
            {icon: 'sword', name: 'Attack', level: 0, cost: 5, purchaseHandler: function(button, player) {
                player.clickDmg += 1;
            }},
            {icon: 'person', name: 'Auto-Attack', level: 0, cost: 25, purchaseHandler: function(button, player) {
                player.dps += 5;
            }}
        ];

        var button;
        upgradeButtonsData.forEach(function(buttonData, index) {
            button = state.game.add.button(0, (50 * index), state.game.cache.getBitmapData('button'));
            button.icon = button.addChild(state.game.add.image(6, 6, buttonData.icon));
            button.text = button.addChild(state.game.add.text(42, 6, buttonData.name + ': ' + buttonData.level, {font: '16px Arial Black'}));
            button.details = buttonData;
            button.costText = button.addChild(state.game.add.text(42, 24, 'Cost: ' + buttonData.cost, {font: '16px Arial Black'}));
            button.events.onInputDown.add(state.onUpgradeButtonClick, state);

            upgradeButtons.addChild(button);
        });

        var monsterData = [
            {name: 'Green Slime',        image: 'slime',        maxHealth: 500},
            {name: 'Wind Snake',          image: 'snake',       maxHealth: 1000},
            {name: 'Screamer Mandrake',               image: 'mandrake',        maxHealth: 1000},
            {name: 'Toxic Shroom',      image: 'shroom',        maxHealth: 1000},
            {name: 'Toxic Cactus',          image: 'cactus',        maxHealth: 1500},
            {name: 'Psycho Manti',    image: 'mantis',        maxHealth: 2000},
            {name: 'Wind Fairy',       image: 'fairy',        maxHealth: 2500},
            {name: 'Toxic Carnivorous Plant',   image: 'plant',        maxHealth: 3000},
            {name: 'Dryad Queen',      image: 'dryad',        maxHealth: 3500},
            {name: 'Continental Turtle',        image: 'turtle',        maxHealth: 5000},
        ];
        this.monsters = this.game.add.group();

        var monster;
        monsterData.forEach(function(data) {
            // create a sprite for them off screen
            monster = state.monsters.create(3000, state.game.world.centerY, data.image);
            // use the built in health component
            monster.health = monster.maxHealth = data.maxHealth;
            // center anchor
            monster.anchor.setTo(0.5, 1);
            // reference to the database
            monster.details = data;

            //enable input so we can click it!
            monster.inputEnabled = true;
            monster.events.onInputDown.add(state.onClickMonster, state);

            // hook into health and lifecycle events
            monster.events.onKilled.add(state.onKilledMonster, state);
            monster.events.onRevived.add(state.onRevivedMonster, state);
        });

        // display the monster front and center

        this.currentMonster = this.monsters.getChildAt(0);
        this.currentMonster.position.set(this.game.world.centerX , this.game.world.centerY + 50);

        this.monsterInfoUI = this.game.add.group();
        this.monsterInfoUI.position.setTo(this.currentMonster.x - 150, this.currentMonster.y + 120);
        this.monsterNameText = this.monsterInfoUI.addChild(this.game.add.text(0, 0, this.currentMonster.details.name, {
            font: '48px Arial Black',
            fill: '#fff',
            strokeThickness: 4
        }));
        this.monsterHealthText = this.monsterInfoUI.addChild(this.game.add.text(0, 80, this.currentMonster.health + ' HP', {
            font: '32px Arial Black',
            fill: '#ff0000',
            strokeThickness: 4
        }));

        this.dmgTextPool = this.add.group();
        var dmgText;
        for (var d=0; d<50; d++) {
            dmgText = this.add.text(0, 0, '1', {
                font: '64px Arial Black',
                fill: '#fff',
                strokeThickness: 4
            });
            // start out not existing, so we don't draw it yet
            dmgText.exists = false;
            dmgText.tween = game.add.tween(dmgText)
                .to({
                    alpha: 0,
                    y: 100,
                    x: this.game.rnd.integerInRange(100, 700)
                }, 1000, Phaser.Easing.Cubic.Out);

            dmgText.tween.onComplete.add(function(text, tween) {
                text.kill();
            });
            this.dmgTextPool.add(dmgText);
        }
        // creates a timer
        this.gameTimer = this.game.time.events.loop(1000, this.onTimer, this);
        this.playerTimeText = this.add.text(30, 5, 'Time: ' + this.player.time, {
            font: '24px Arial Black',
            fill: '#fff',
            strokeThickness: 4
        });

        // create a pool of gold coins
        this.coins = this.add.group();
        this.coins.createMultiple(50, 'gold_coin', '', false);
        this.coins.setAll('inputEnabled', true);
        this.coins.setAll('goldValue', 1);
        this.coins.callAll('events.onInputDown.add', 'events.onInputDown', this.onClickCoin, this);

        this.playerGoldText = this.add.text(30, 30, 'Gold: ' + this.player.gold, {
            font: '24px Arial Black',
            fill: '#fff',
            strokeThickness: 4
        });

        // 100ms 10x a second
        this.dpsTimer = this.game.time.events.loop(100, this.onDPS, this);

        // setup the world progression display
        this.levelUI = this.game.add.group();
        this.levelUI.position.setTo(this.game.world.centerX, 30);
        this.levelText = this.levelUI.addChild(this.game.add.text(-50, 0, 'Level: ' + this.level, {
            font: '24px Arial Black',
            fill: '#fff',
            strokeThickness: 4
        }));

    },
    onDPS: function() {
        if (this.player.dps > 0) {
            if (this.currentMonster && this.currentMonster.alive) {
                var dmg = this.player.dps / 10;
                this.currentMonster.damage(dmg);
                // update the health text
                this.monsterHealthText.text = this.currentMonster.alive ? Math.round(this.currentMonster.health) + ' HP' : 'DEAD';
            }
        }
    },
    onTimer: function() {
        if(this.player.time < 1) {
            game.state.start('over');
        }
        this.player.time--;
        this.playerTimeText.text = 'Time: ' + this.player.time;
    },
    onUpgradeButtonClick: function(button, pointer) {
        // make this a function so that it updates after we buy
        function getAdjustedCost() {
            return Math.ceil(button.details.cost + (button.details.level * 1.46));
        }

        if (this.player.gold - getAdjustedCost() >= 0) {
            this.player.gold -= getAdjustedCost();
            this.playerGoldText.text = 'Gold: ' + this.player.gold;
            button.details.level++;
            button.text.text = button.details.name + ': ' + button.details.level;
            button.costText.text = 'Cost: ' + getAdjustedCost();
            button.details.purchaseHandler.call(this, button, this.player);
        }
    },
    onClickCoin: function(coin) {
        if (!coin.alive) {
            return;
        }
        // give the player gold
        this.player.gold += coin.goldValue;
        // update UI
        this.playerGoldText.text = 'Gold: ' + this.player.gold;
        // remove the coin
        coin.kill();
    },
    onKilledMonster: function(monster) {

        // move the monster off screen again
        monster.position.set(1000, this.game.world.centerY);

        var coin;
        // spawn a coin on the ground
        coin = this.coins.getFirstExists(false);
        coin.reset(this.game.world.centerX + this.game.rnd.integerInRange(-100, 100), this.game.world.centerY);
        coin.goldValue = Math.round(this.level * 20);
        this.game.time.events.add(Phaser.Timer.SECOND * 3, this.onClickCoin, this, coin);

        this.levelKills++;

        if (this.levelKills >= this.levelKillsRequired) {
            this.level++;
            this.levelKills = 0;
        }

        this.levelText.text = 'Level: ' + this.level;
        if(this.level > 10) {
            game.state.start('win');
        } else {
            // pick a new monster
            this.currentMonster = this.monsters.getChildAt((this.level - 1)% 10);
            // upgrade the monster based on level
             this.currentMonster.maxHealth = Math.ceil(this.currentMonster.details.maxHealth + ((this.level - 1) * 10.6));
            // make sure they are fully healed
            this.currentMonster.revive(this.currentMonster.maxHealth);
        }
        
    },
    onRevivedMonster: function(monster) {
        monster.position.set(this.game.world.centerX , this.game.world.centerY + 50);
        // update the text display
        this.monsterNameText.text = monster.details.name;
        this.monsterHealthText.text = monster.health + 'HP';
    },
    onClickMonster: function(monster, pointer) {
        // apply click damage to monster
        this.currentMonster.damage(this.player.clickDmg);

        // grab a damage text from the pool to display what happened
        var dmgText = this.dmgTextPool.getFirstExists(false);
        if (dmgText) {
            dmgText.text = this.player.clickDmg;
            dmgText.reset(pointer.positionDown.x, pointer.positionDown.y);
            dmgText.alpha = 1;
            dmgText.tween.start();
            var audio = new Audio('assets/sfx/mixkit-small-hit-in-a-game-2072.wav');
            audio.play()
        }

        // update the health text
        this.monsterHealthText.text = this.currentMonster.alive ? this.currentMonster.health + ' HP' : 'DEAD';
    }
});
game.state.start('play');
