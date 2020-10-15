
        const ROIDS_NUM = 3//starting number of asteroids
        const ROIDS_SIZE= 100//starting size of asteroids in pixels
        const ROIDS_SPD = 50//max staring speed of asteroids in pixels per second
        const FPS = 30;//frames per second
        const GAME_LIVES = 3// starting number of lifes
        const ROIDS_JAG = 0.3 //jaggedness of the asteroids (0=none, 1= lots )
        const LASER_MAX = 10 //max number of lasers on screen at once
        const ROIDS_PTS_LGE = 20 //points scored for large asteroids
        const ROIDS_PTS_MED = 50 //points scored for medium asteroids
        const ROIDS_PTS_SML = 100//points scored for small asteroid
        const SAVE_KEY_SCORE = "highscore"; //save key for localStorage of highScore
        const LASER_DIST = 0.6 //max distance laser can travel as fraction of screen width
        const LASER_SPD = 500 //speed of laser in pixels per second
        const LASER_EXPLODE_DUR = 0.1 //duration of the Laser's explosion
        const ROIDS_VERT = 10 //average number of vertices on each asteroid
        const FRICTION = 0.7 // friction coeffient of space
        const SHIP_BLINK_DUR = 0.1//duration of the ship's blink during invisibilty in seconds
        const SHIP_EXPLODE_DUR = 0.3 //duration of the ship's explosion
        const SHIP_INV_DUR = 3 //duration of the ship's innivisibility in seconds
        const SHIP_SIZE = 30;//ship height is pixels
        const SHIP_THRUST = 5;//accelaration of the ship in pixels per second with next second
        const TURN_SPEED = 360//turn speed in degrees per second
        const MUSIC_ON = true
        const SOUND_ON = true
        const SHOW_BOUNDING = false;//show or hode collision bounding
        const SHOW_CENTRE_DOT = false//show or hide ship's centre dot
        const TEXT_FADE_TIME = 2.5;// text fade time in seconds
        const TEXT_SIZE = 40;// text font height in pixels

        /** @type {HTMLCanvasElement} */ 
        var canv = document.getElementById("gameCanvas")
        var ctx = canv.getContext("2d")

        // set up  sound effects
        var fxLaser = new Sound("sounds/laser.m4a",5,0.3);
        var fxExplode = new Sound("sounds/explode.m4a");
        var fxHit = new Sound("sounds/hit.m4a");
        var fxThrust = new Sound("sounds/thrust.m4a");
        
        // set up the music
        var music = new Music("sounds/music-low.m4a", "sounds/music-high.m4a")
        var roidsLeft, roidsTotal;


        //set up the game parameters
        var level,lives,roids,ship, text, scoreHigh,textAlpha,score;
        newGame()

        //set up the spaceship object 
        var ship = newShip()
        //set up asteroids
        var roids = []
        createAsteroidsBelt()

        //set up event handlers
        document.addEventListener("keydown", keyDown)
        document.addEventListener("keyup", keyUp) 
    
        //set up the game loop
        setInterval(update, 1000/FPS)

        function createAsteroidsBelt(){
            roids = []
            roidsTotal = (ROIDS_NUM + 1) * 7
            roidsLeft = roidsTotal
            var x,y;
            for(var i = 0; i < ROIDS_NUM + level ; i++){
                do{
                    x = Math.floor(Math.random() * canv.width)
                    y = Math.floor(Math.random() * canv.height)
                }while(distBetweenPoints(ship.x, ship.y, x, y) < ROIDS_SIZE * 2 + ship.r)
                //console.log(roids.push(newAsteroids(x,y)))
                roids.push(newAsteroids(x,y, Math.ceil(ROIDS_SIZE / 2)))
            }
        }

        function destroyAsteriods(index){
            var x = roids[index].x
            var y = roids[index].y
            var r = roids[index].r

            //split the asteroids in two if necessary
            if(r == Math.ceil(ROIDS_SIZE / 2)){
                roids.push(newAsteroids(x,y,Math.ceil(ROIDS_SIZE/4)))
                roids.push(newAsteroids(x,y,Math.ceil(ROIDS_SIZE/4)))
                score += ROIDS_PTS_LGE
            } else if (r == Math.ceil(ROIDS_SIZE / 4)) {
                roids.push(newAsteroids(x,y,Math.ceil(ROIDS_SIZE / 8)))
                roids.push(newAsteroids(x,y,Math.ceil(ROIDS_SIZE / 8)))
                score += ROIDS_PTS_MED;
            }else{
                score += ROIDS_PTS_SML;
            }

            // check high score
            if(score > scoreHigh){
                scoreHigh = score
                localStorage.setItem(SAVE_KEY_SCORE, scoreHigh)
            }

            //destroy the asteriods
            roids.splice(index,1)
            fxHit.play()

            // calculate of ratio remaining asteroids to determine music tempo
            roidsLeft--;
            music.setAsteriodsRatio(roidsLeft == 0 ? 1 : roidsLeft / roidsTotal)

            //new level when no more asteroids
            if(roids.length == 0){
                level++;
                newLevel()
            }
        }

        function distBetweenPoints(x1,y1,x2,y2){
            return Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1, 2))
        }

        function drawShip(x,y,a, colour = "white"){
            ctx.strokeStyle = colour
                    ctx.lineWidth = SHIP_SIZE/20
                    ctx.beginPath()
                    //console.log(blinkOn)
                    // console.log(ship.blinkNum)

                    ctx.moveTo(//nose of the ship.HELPS TO MOVE THE CURSOR TO THE WHERE WE WANT TO START
                        x + 4/3 * ship.r * Math.cos(a),
                        y - 4/3 * ship.r * Math.sin(a)
                    )

                    ctx.lineTo(//rear left
                        x - ship.r * (2/3 *Math.cos(a) + Math.sin(a)), 
                        y + ship.r * (2/3 *Math.sin(a) - Math.cos(a))
                    )

                    ctx.lineTo(//rear right
                        x - ship.r * (2/3 * Math.cos(a) - Math.sin(a)), 
                        y + ship.r * ( 2/3 *Math.sin(a) + Math.cos(a))
                    )

                    ctx.closePath()
                    ctx.stroke()
        }

        function explodeShip(){
            ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS)
            fxExplode.play()
        }

        function gameOver(){
            ship.dead = true;
            text = "Game Over";
            textAlpha = 1.0;
        }

        function keyDown(/** @type {KeyboardEvent} */ ev){
            if(ship.dead){
                return;
            }

            switch(ev.keyCode){
                case 32://space bar (shoot laser)
                shootLaser()
                break
                case 37://left arrow(rotate ship left)
                ship.rot = TURN_SPEED/ 180 * Math.PI / FPS
                break
                ship.rot = TURN_SPEED/ 180 * Math.PI / FPS
                case 38://up arrow(thrust the ship forward)
                ship.thrusting = true
                break
 
                case 39://rignt arrow(rotate ship right)
                ship.rot = -TURN_SPEED/ 180 * Math.PI / FPS
                break
            }
        }

        function keyUp(/** @type {KeyboardEvent} */ ev){
            if(ship.dead){
                return;
            }

            switch(ev.keyCode){
                case 32://space bar (allow shooting again)
                ship.canShoot = true
                break
                case 37://left arrow(stop rotating let)
                ship.rot = 0
                break
                ship.rot = TURN_SPEED/ 180 * Math.PI / FPS
                case 38://up arrow(sotp thrusting)
                ship.thrusting = false
                break 
                case 39://rignt arrow(stop rotating right)
                ship.rot = 0
                break
            }
        }

        function newAsteroids(x,y,r){
            var lvlMult = 1 + 0.1 * level
            var roid = {
                x: x,
                y: y,
                xv: Math.random() * ROIDS_SPD * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
                yv: Math.random() * ROIDS_SPD * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
                r:r,
                a: Math.random() * Math.PI * 2, //in radians
                vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT/2),//refers to number of vertices in a asteroids
                offs:[]
            }
            //console.log(roid.vert)

            //create the vertex offets array
            for(var i=0;i<roid.vert; i++){
                roid.offs.push(Math.random() * ROIDS_JAG * 2 + 1- ROIDS_JAG)
            }
            return roid
        }

        function newGame(){
            lives = GAME_LIVES
            level = 0;
            score = 0;
            ship = newShip();

            //get the high score from local Storage
            var scoreStr = localStorage.getItem(SAVE_KEY_SCORE);  
            if(scoreStr == null){
                scoreHigh = 0
            } else {
                scoreHigh = parseInt(scoreStr)
            }
            newLevel();
        }

        function newLevel() {
            text = "Level " + (level + 1)
            textAlpha = 1.0;
            createAsteroidsBelt()
        }

        function newShip(){
                return {
                x:canv.width/2,
                y:canv.height/2,
                r:SHIP_SIZE/2,
                canShoot: true,
                a:90/180 *Math.PI,
                dead: false,
                blinkNum:Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
                blinkTime:Math.ceil(SHIP_BLINK_DUR* FPS),
                explodeTime: 0,
                lasers:[],
                rot:0,// converting to radians
                thrusting:false,
                thrust:{
                    x:0,
                    y:0
                }
            }
        }

        function shootLaser(){
            //create the laser objects
            if(ship.canShoot && ship.lasers.length < LASER_MAX){
                ship.lasers.push({//from the nose of the ship
                   x:ship.x + 4/3 * ship.r * Math.cos(ship.a),
                    y:ship.y - 4/3 * ship.r * Math.sin(ship.a),
                    xv: LASER_SPD * Math.cos(ship.a) / FPS,
                    yv: -LASER_SPD * Math.sin(ship.a) / FPS,
                    dist: 0,
                    explodeTime: 0
                })
                fxLaser.play()
            }

            //prevent furthur shooting
            ship.canShoot = false
        }

        function Sound(src,maxStreams = 1, vol = 1.0){
            this.streamNum = 0;
            this.streams = [];
            for(var i = 0; i< maxStreams; i++){
                this.streams.push(new Audio(src))
                this.streams[i].volume = vol
            }

            this.play = function(){
                if(SOUND_ON){
                    this.streamNum = (this.streamNum + 1) % maxStreams
                    this.streams[this.streamNum].play()
                }
            }

            this.stop = function(){
                this.streams[this.streamNum].pause()
                this.streams[this.streamNum].currentTime = 0
            }
        }

        function Music(srclow, srcHigh){
            this.soundLow = new Audio(srclow)
            this.soundHigh = new Audio(srcHigh)
            this.low = true
            this.tempo = 1.0 //seconds per beat
            this.beatTime = 0;// frames left until next beat

            this.play = function(){
                if(MUSIC_ON){
                    if(this.low){
                    this.soundLow.play()
                    } else {
                    this.soundHigh.play()
                    }
                    this.low = !this.low
                    }
            }

            this.setAsteriodsRatio = function(ratio){
                this.tempo = 1.0 - 0.75 * (1.0 - ratio)
            }

            this.tick = function(){
                if(this.beatTime == 0){
                    this.play()
                    this.beatTime = Math.ceil(this.tempo * FPS)
                } else {
                    this.beatTime--;
                }
            }
        }

        function update(){
            var blinkOn = ship.blinkNum % 2 == 0
            var exploding = ship.explodeTime > 0;

            // tick the music
            music.tick()

            //draw space 
            ctx.fillStyle = "black"
            ctx.fillRect(0,0 ,canv.width, canv.height)

            //thrust the ship
            if(ship.thrusting && !ship.dead){
                ship.thrust.x += SHIP_THRUST * Math.cos(ship.a) / FPS
                ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a) /FPS
                fxThrust.play()
                //draw the thruster
                if(!exploding && blinkOn ){
                    //console.log(exploding)
                    ctx.fillStyle = "#ff0000"
                    ctx.strokeStyle = "yellow"
                    ctx.lineWidth = SHIP_SIZE/10
                    ctx.beginPath()

                    ctx.moveTo(//nose of the ship.HELPS TO MOVE THE CURSOR TO THE WHERE WE WANT TO START
                        ship.x - ship.r * (2/3 *Math.cos(ship.a) + 0.5 * Math.sin(ship.a)), 
                        ship.y + ship.r * (2/3 *Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
                    
                    )
    
                    ctx.lineTo(//rear left
                        ship.x - ship.r * 6/3 * Math.cos(ship.a), 
                        ship.y + ship.r * 6/3 *Math.sin(ship.a)
                    )

                    ctx.lineTo(//rear right
                    ship.x - ship.r * (2/3 * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)), 
                    ship.y + ship.r * ( 2/3 *Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
                    )
    
                    ctx.closePath()
                    ctx.fill()
                    ctx.stroke()
                }
            }else{
                //apply friction (slow the ship down when not thrusting)
                ship.thrust.x -= FRICTION * ship.thrust.x / FPS
                ship.thrust.y -= FRICTION * ship.thrust.y / FPS
                fxThrust.stop()
            }

            

            //draw a traingular ship
            if(!exploding){
                if(blinkOn && !ship.dead){
                    drawShip(ship.x, ship.y, ship.a )
                }

                //handle blibking
                if(ship.blinkNum > 0){
                    //reduce blink time
                    ship.blinkTime--

                    //reduce the blink num
                    if(ship.blinkTime == 0){
                        ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS)
                        ship.blinkNum--
                        
                    }
                }

            }else{
                //draw the explotion
                ctx.fillStyle = "darkred"
                ctx.beginPath()
                ctx.arc(ship.x,ship.y, ship.r * 1.7, Math.PI*2, false)
                ctx.fill()
                ctx.fillStyle = "red"
                ctx.beginPath()
                ctx.arc(ship.x,ship.y, ship.r * 1.4, Math.PI*2, false)
                ctx.fill()
                ctx.fillStyle = "orange"
                ctx.beginPath()
                ctx.arc(ship.x,ship.y, ship.r * 1.1, Math.PI*2, false)
                ctx.fill()
                ctx.fillStyle = "yellow"
                ctx.beginPath()
                ctx.arc(ship.x,ship.y, ship.r * 0.8, Math.PI*2, false)
                ctx.fill()
                ctx.fillStyle = "white"
                ctx.beginPath()
                ctx.arc(ship.x,ship.y, ship.r * 0.5, Math.PI*2, false)
                ctx.fill()

            }

            if(SHOW_BOUNDING){
            }

            //draw the asteroids
            var x,y,r,a,vert, offs;
            for(var i=0;i<roids.length;i++){
                ctx.strokeStyle = 'slategrey'
                ctx.lineWidth = SHIP_SIZE/20

                //get the asteroids properties
                x = roids[i].x
                y = roids[i].y
                r = roids[i].r
                a = roids[i].a
                vert = roids[i].vert
                offs = roids[i].offs

                //draw a path  
                ctx.beginPath()
                ctx.moveTo(
                    x + r * offs[0] * Math.cos(a),
                    y + r * offs[0] * Math.sin(a)
                )
                //console.log(x + r * offs[0] * Math.cos(a))

                //draw the ploygon
                for(var j=1;j<vert;j++){
                    //console.log(vet)
                    ctx.lineTo(
                        x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert),
                        y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert)
                    )
                    //console.log(x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert))
                }
                ctx.closePath()
                ctx.stroke()

                
            if(SHOW_BOUNDING){
            } 
                //console.log(roids[i].y)
            }
   
            // centre dot
            if(SHOW_CENTRE_DOT){
                ctx.fillStyle = "red"
                ctx.fillRect(ship.x - 1, ship.y -1, 2, 2)
            }
 
            //draw the lasers
            for(var i = 0; i < ship.lasers.length; i++){
                if(ship.lasers[i].explodeTime == 0) {
                    ctx.fillStyle = "salmon"
                    ctx.beginPath()
                    ctx.arc(ship.lasers[i].x, ship.lasers[i].y, SHIP_SIZE / 15, 0 ,Math.PI * 2, false)
                    ctx.fill()
                } else {
                    //draw the explotion
                    ctx.fillStyle = "orangered"
                    ctx.beginPath()
                    ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.75, 0 ,Math.PI * 2, false)
                    ctx.fill()
                    ctx.fillStyle = "salmon"
                    ctx.beginPath()
                    ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.5, 0 ,Math.PI * 2, false)
                    ctx.fill()
                    ctx.fillStyle = "pink"
                    ctx.beginPath()
                    ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.25, 0 ,Math.PI * 2, false)
                    ctx.fill()
                }
            }

            //draw the game text
            if(textAlpha >= 0){
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"
                ctx.fillStyle = "rgba(255,255,255, " + textAlpha + ")";
                ctx.font = "small-caps " + TEXT_SIZE + "px dejavu sans mono";
                ctx.fillText(text, canv.width / 2, canv.height * 0.75);
                textAlpha -= (1.0 / TEXT_FADE_TIME / FPS)
            }else if( ship.dead){
                newGame()
            }

            // draw the lives
            var lifeColour;
            for(var i = 0; i < lives; i++) {
                lifeColour = exploding && i == lives - 1 ? "red" : "white"
                drawShip(SHIP_SIZE + i * SHIP_SIZE * 1.2, SHIP_SIZE, 0.5 * Math.PI, lifeColour)
            }

            // draw the score
            ctx.textAlign = "right"
            ctx.textBaseline = "middle"
            ctx.fillStyle = "white";
            ctx.font = TEXT_SIZE + "px dejavu sans mono";
            ctx.fillText(score, canv.width - SHIP_SIZE / 2, SHIP_SIZE);

          

            // draw the high score
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillStyle = "white";
            ctx.font = (TEXT_SIZE * 0.75) + "px dejavu sans mono";
            ctx.fillText("BEST " + scoreHigh, canv.width / 2, SHIP_SIZE);


            //detect laser hits on asteroids
            var ax,ar,lx,ly;
            for(var i=roids.length-1;i>=0;i--){

                //grab the asteroids properties
                ax = roids[i].x
                ay = roids[i].y
                ar = roids[i].r 
                //loop  over the lasers
                for(var j = ship.lasers.length-1; j >=0;j--){

                    //grab the lser properties
                    lx = ship.lasers[j].x
                    ly = ship.lasers[j].y

                    //detect hits
                    if(ship.lasers[j].explodeTime == 0 && distBetweenPoints(ax,ay,lx,ly) < ar){
        
                        //destroy the asteriods and activate the laser explotion
                        destroyAsteriods(i)
                        ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DUR * FPS)
                        break;
                    }
                }
            }
            
            //check for asteroids collision (when not exploding)
            if(!exploding){
                if(ship.blinkNum == 0 && !ship.dead)
                {
                    for(var i = 0; i < roids.length; i++){
                        if(distBetweenPoints(ship.x,ship.y,roids[i].x, roids[i].y) <  ship.r + roids[i].r){
                            explodeShip()
                            destroyAsteriods(i)
                            break;
                        }
                    }
                }           
                //rotate ship
                ship.a += ship.rot
            
                //move the ship
                ship.x += ship.thrust.x  
                ship.y += ship.thrust.y     
            }else{
                //reduce the explpode time
                ship.explodeTime--;

                //reset the ship after the explotion has finished
                if(ship.explodeTime == 0){
                    lives--
                    if(lives == 0){
                        gameOver()
                    }else{
                        ship = newShip()   
                    }
                }
            }
 

            //handle edge of screen
            if(ship.x <0 - ship.r){
                ship.x = canv.width + ship.r
            }else if( ship.x > canv.width + ship.r){
                ship.x = 0-ship.r
            }
            if(ship.y <0 - ship.r){
                ship.y = canv.height + ship.r
            }else if( ship.y > canv.height + ship.r){
                ship.y = 0-ship.r
            }

            //move the lasers
            for(var i=ship.lasers.length-1; i >= 0; i--){
                ship.lasers[i].x += ship.lasers[i].xv;
                ship.lasers[i].y += ship.lasers[i].yv
                //check distance travelled
                if(ship.lasers[i].dist > LASER_DIST * canv.width){
                    ship.lasers.splice(i,1)
                    continue//if true continue furthur
                }

                //handle the explotion
                if(ship.lasers[i].explodeTime > 0){
                    ship.lasers[i].explodeTime--;

                    //destroy the laser after the duration is up
                    if(ship.lasers[i].explodeTime == 0){
                        ship.lasers.splice(i,1)
                        continue;//prevent it from going over the remaning code will jump back to the next iteration
                    }
                }else {
                    //move the lasers
                    ship.lasers[i].x += ship.lasers[i].xv
                    ship.lasers[i].y += ship.lasers[i].yv
                    //calculate the distance travelled
                    ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv,2) + Math.pow(ship.lasers[i].yv,2))
                }
                //handle edge of the screen
                if(ship.lasers[i].x < 0){
                    ship.lasers[i].x = canv.width
                }else if(ship.lasers[i].x > canv.width){
                    ship.lasers[i].x = 0
                }
                if(ship.lasers[i].y < 0){
                    ship.lasers[i].y = canv.height
                }else if(ship.lasers[i].y > canv.height){
                    ship.lasers[i].y = 0
                }
            }

            //move the asteroids
            for(var i = 0; i < roids.length; i++)
            {
                roids[i].x += roids[i].xv
                roids[i].y += roids[i].yv

                //handle edge of screen
                if(roids[i].x < 0 - roids[i].r){
                    roids[i].x = canv.width + roids[i].r
                }else if(roids[i].x > canv.width + roids[i].r){
                    roids[i].x = 0 - roids[i].r
                }
                if(roids[i].y < 0 - roids[i].r){
                    roids[i].y = canv.height + roids[i].r
                }else if(roids[i].y > canv.height + roids[i].r){
                    roids[i].y = 0 - roids[i].r
                }
            }
        }
