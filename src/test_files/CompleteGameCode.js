/**
    The base class for all elements that appear in the game.
    @author <a href="mailto:matthewcasperson@gmail.com">Matthew Casperson</a>
    @class
*/
function GameObject()
{
    /** Display depth order. A smaller zOrder means the element is rendered first, and therefor
        in the background.
        @type Number
    */
    this.zOrder = 0;
    /**
        The position on the X axis
        @type Number
    */
    this.x = 0;
    /**
        The position on the Y axis
        @type Number
    */
    this.y = 0;
    
    /**
        Initialises the object, and adds it to the list of objects held by the GameObjectManager.
        @param x        The position on the X axis
        @param y        The position on the Y axis
        @param z        The z order of the element (elements in the background have a lower z value)
    */
    this.startupGameObject = function(/**Number*/ x, /**Number*/ y, /**Number*/ z)
    {
        this.zOrder = z;
        this.x = x;
        this.y = y;
        g_GameObjectManager.addGameObject(this);
        return this;
    }
    
    /**
        Cleans up the object, and removes it from the list of objects held by the GameObjectManager.
    */
    this.shutdownGameObject = function()
    {
        g_GameObjectManager.removeGameObject(this);
    }

    this.shutdown = function()
    {
         this.shutdownGameObject();
    }
}

/**
    The base class for all elements that appear in the game.
    @author <a href="mailto:matthewcasperson@gmail.com">Matthew Casperson</a>
    @class
*/
function VisualGameObject()
{
    /**
        The image that will be displayed by this object
        @type Image
    */
    this.image = null;
    
    /**
        Draws this element to the back buffer
        @param dt Time in seconds since the last frame
		@param context The context to draw to
		@param xScroll The global scrolling value of the x axis  
		@param yScroll The global scrolling value of the y axis  
    */
    this.draw = function(/**Number*/ dt, /**CanvasRenderingContext2D*/ context, /**Number*/ xScroll, /**Number*/ yScroll)
    {
        context.drawImage(this.image, this.x - xScroll, this.y - yScroll);
    }
    
    /**
        Initialises this object
        @param image The image to be displayed
		@param x The position on the X axis
        @param y The position on the Y axis
		@param z The depth
    */
    this.startupVisualGameObject = function(/**Image*/ image, /**Number*/ x, /**Number*/ y, /**Number*/ z)
    {
        this.startupGameObject(x, y, z);
        this.image = image;
        return this;
    }
    
    /**
        Clean this object up
    */
    this.shutdownVisualGameObject = function()
    {
        this.image = null;
        this.shutdownGameObject();
    }

    this.shutdown = function()
    {
        this.shutdownVisualGameObject();
    }

    this.collisionArea = function()
    {
        return new Rectangle().startupRectangle(this.x, this.y, this.image.width, this.image.height);
    }
}
VisualGameObject.prototype = new GameObject;

/**
    Displays an animated Game Object
    @author <a href="mailto:matthewcasperson@gmail.com">Matthew Casperson</a>
    @class
*/
function AnimatedGameObject()
{
    /**
        Defines the current frame that is to be rendered
        @type Number
     */
    this.currentFrame = 0;
    /**
        Defines the frames per second of the animation
        @type Number
     */
    this.timeBetweenFrames = 0;
    /**
        The number of individual frames held in the image
        @type Number
     */
    /**
        Time until the next frame
        @type number
     */
    this.timeSinceLastFrame = 0;
    /**
        The width of each individual frame
        @type Number
     */
    this.frameWidth = 0;

    /**
        Initialises this object
        @param image The image to be displayed
		@param x The position on the X axis
        @param y The position on the Y axis
		@param z The depth
        @param frameCount The number of animation frames in the image
        @param fps The frames per second to animate this object at
    */
    this.startupAnimatedGameObject = function(/**Image*/ image, /**Number*/ x, /**Number*/ y, /**Number*/ z, /**Number*/ frameCount, /**Number*/ fps)
    {
        if (frameCount <= 0) throw "framecount can not be <= 0";
        if (fps <= 0) throw "fps can not be <= 0"

        this.startupVisualGameObject(image, x, y, z);
        this.currentFrame = 0;
        this.frameCount = frameCount;
        this.timeBetweenFrames = 1/fps;
        this.timeSinceLastFrame = this.timeBetweenFrames;
        this.frameWidth = this.image.width / this.frameCount;

        return this;
    }

    this.setAnimation = function(/**Image*/ image, /**Number*/ frameCount, /**Number*/ fps)
    {
        if (frameCount <= 0) throw "framecount can not be <= 0";
        if (fps <= 0) throw "fps can not be <= 0"

        this.image = image;
        this.currentFrame = 0;
        this.frameCount = frameCount;
        this.timeBetweenFrames = 1/fps;
        this.timeSinceLastFrame = this.timeBetweenFrames;
        this.frameWidth = this.image.width / this.frameCount;
    }

    /**
        Draws this element to the back buffer
        @param dt Time in seconds since the last frame
		@param context The context to draw to
		@param xScroll The global scrolling value of the x axis
		@param yScroll The global scrolling value of the y axis
    */
    this.draw = function(/**Number*/ dt, /**CanvasRenderingContext2D*/ context, /**Number*/ xScroll, /**Number*/ yScroll)
    {
        var sourceX = this.frameWidth * this.currentFrame;
        context.drawImage(this.image, sourceX, 0, this.frameWidth, this.image.height, this.x - xScroll, this.y - yScroll, this.frameWidth, this.image.height);

        this.timeSinceLastFrame -= dt;
        if (this.timeSinceLastFrame <= 0)
        {
           this.timeSinceLastFrame = this.timeBetweenFrames;
           ++this.currentFrame;
           this.currentFrame %= this.frameCount;
        }
    }

    this.shutdownAnimatedGameObject = function()
    {
        this.shutdownVisualGameObject();
    }

    this.shutdown = function()
    {
        this.shutdownAnimatedGameObject();
    }

    this.collisionArea = function()
    {
        return new Rectangle().startupRectangle(this.x, this.y, this.frameWidth, this.image.height);
    }
}

AnimatedGameObject.prototype = new VisualGameObject;

/**
    The ApplicationManager is used to manage the application itself.
    @author <a href="mailto:matthewcasperson@gmail.com">Matthew Casperson</a>
    @class
*/
function ApplicationManager()
{
    this.canvasWidth = 0;
    this.canvasHeight = 0;

    /**
        Initialises this object
        @param canvasWidth      The width of the canvas
        @param canvasHeight     The height of the canvas
        @return                 A reference to the initialised object

    */
    this.startupApplicationManager = function(canvasWidth, canvasHeight)
    {
        g_ApplicationManager = this;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        this.openMainMenu();

        return this;
    }

    this.startLevel = function()
    {
        g_GameObjectManager.shutdownAll();
        this.level = new Level().startupLevel(this.canvasWidth, this.canvasHeight);
        this.background3 = new RepeatingGameObject().startupRepeatingGameObject(g_ResourceManager.background2, 0, 100, 3, 600, 320, 0.75);
        this.background2 = new RepeatingGameObject().startupRepeatingGameObject(g_ResourceManager.background1, 0, 100, 2, 600, 320, 0.5);
        this.background = new RepeatingGameObject().startupRepeatingGameObject(g_ResourceManager.background0, 0, 0, 1, 600, 320, 0.25);
        g_player = new Player().startupPlayer(this.level);
        this.updateScore();
    }

    this.openMainMenu = function()
    {
        g_GameObjectManager.shutdownAll();
        g_GameObjectManager.xScroll = 0;
        g_GameObjectManager.yScroll = 0;
        g_score = 0;
        this.mainMenu = new MainMenu().startupMainMenu();
    }

    this.updateScore = function()
    {
        var score = document.getElementById("Score");
        score.innerHTML = String(g_score);
    }
}

/**
    A manager for all the objects in the game
    @author <a href="mailto:matthewcasperson@gmail.com">Matthew Casperson</a>
    @class
*/
function GameObjectManager()
{
    /** An array of game objects 
        @type Arary
    */
    this.gameObjects = new Array();
    /** An array of new game objects
        @type Arary
    */
    this.addedGameObjects = new Array();
    /** An array of removed game objects
        @type Arary
    */
    this.removedGameObjects = new Array();
    /** The time that the last frame was rendered  
        @type Date
    */
    this.lastFrame = new Date().getTime();
    /** The global scrolling value of the x axis  
        @type Number
    */
    this.xScroll = 0;
    /** The global scrolling value of the y axis  
        @type Number
    */
    this.yScroll = 0;
    /** A reference to the canvas element  
        @type HTMLCanvasElement
    */
    this.canvas = null;
    /** A reference to the 2D context of the canvas element
        @type CanvasRenderingContext2D
    */
    this.context2D = null;
    /** A reference to the in-memory canvas used as a back buffer 
        @type HTMLCanvasElement
    */
    this.backBuffer = null;
    /** A reference to the backbuffer 2D context 
        @type CanvasRenderingContext2D
    */
    this.backBufferContext2D = null;
    /** True if the canvas element is supported, false otherwise
        @type Boolean
    */
    this.canvasSupported = false;
	/** True if the resources supplied to the ResourceManager are all loaded, false otherwise
        @type Boolean
    */
    this.resourcesLoaded = false;
	/** The current colour of the loading screen
        @type Number
    */
	this.loadingScreenCol = 0;
	/** The direction of the changes to the loading screen colour.
		1 = colour moving towards white
		-1 = colour moving topwards balck
        @type Number
    */	
	this.loadingScreenColDirection = 1;
	/** How quickly to change the loading screen colour per second
        @type Number
    */
	this.loadingScreenColSpeed = 255;

    /**
        Initialises this object
        @return A reference to the initialised object
    */
    this.startupGameObjectManager = function()
    {
        // set the global pointer to reference this object
        g_GameObjectManager = this;

        // watch for keyboard events
        document.onkeydown = function(event){g_GameObjectManager.keyDown(event);}
        document.onkeyup = function(event){g_GameObjectManager.keyUp(event);}

        // get references to the canvas elements and their 2D contexts
        this.canvas = document.getElementById('canvas');

        // if the this.canvas.getContext function does not exist it is a safe bet that
        // the current browser does not support the canvas element.
        // in this case we don't go any further, which will save some debuggers (like
        // the IE8 debugger) from throwing up a lot of errors.
        if (this.canvas.getContext)
        {
            this.canvasSupported = true;
            this.context2D = this.canvas.getContext('2d');
            this.backBuffer = document.createElement('canvas');
            this.backBuffer.width = this.canvas.width;
            this.backBuffer.height = this.canvas.height;
            this.backBufferContext2D = this.backBuffer.getContext('2d');
        }

        // create a new ResourceManager
        new ResourceManager().startupResourceManager(
            [{name: 'runLeft', src: 'run_left.png'},
            {name: 'runRight', src: 'run_right.png'},
            {name: 'idleLeft', src: 'idle_left.png'},
            {name: 'idleRight', src: 'idle_right.png'},
            {name: 'background0', src: 'jsplatformer4_b0.png'},
            {name: 'background1', src: 'jsplatformer4_b1.png'},
            {name: 'background2', src: 'jsplatformer4_b2.png'},
            {name: 'block', src: 'BlockA0.png'},
            {name: 'gem', src: 'Gem.png'},
            {name: 'mainmenu', src: 'mainmenu.png'},
            {name: 'portal', src: 'portal.png'}]);

        // use setInterval to call the draw function
        setInterval(function(){g_GameObjectManager.draw();}, SECONDS_BETWEEN_FRAMES);
        
        return this;        
    }
    
    /**
        The render loop
    */
    this.draw = function ()
    {
        // calculate the time since the last frame
        var thisFrame = new Date().getTime();
        var dt = (thisFrame - this.lastFrame)/1000;
        this.lastFrame = thisFrame;

        if (!this.resourcesLoaded)
        {
            var numLoaded = 0;
            for (i = 0; i < g_ResourceManager.imageProperties.length; ++i)
            {
                if (g_ResourceManager[g_ResourceManager.imageProperties[i]].complete)
                {
                    ++numLoaded;
                }
            }
            if ( numLoaded == g_ResourceManager.imageProperties.length )
            {
                // create a new ApplicationManager
                new ApplicationManager().startupApplicationManager(this.canvas.width, this.canvas.height);
                this.resourcesLoaded = true;
            }
            else
            {
                this.loadingScreenCol += this.loadingScreenColDirection * this.loadingScreenColSpeed * dt;
                if (this.loadingScreenCol > 255)
                {
                    this.loadingScreenCol = 255;
                    this.loadingScreenColDirection = -1;
                }
                else if (this.loadingScreenCol < 0)
                {
                    this.loadingScreenCol = 0;
                    this.loadingScreenColDirection = 1;
                }
                this.context2D.fillStyle = "rgb(" + parseInt(this.loadingScreenCol) + "," + parseInt(this.loadingScreenCol) + "," + parseInt(this.loadingScreenCol) + ")";
                this.context2D.fillRect (0, 0, this.canvas.width, this.canvas.height);
            }
        }
        
        // clear the drawing contexts
        if (this.canvasSupported && this.resourcesLoaded)
        {
            this.backBufferContext2D.clearRect(0, 0, this.backBuffer.width, this.backBuffer.height);

            this.addNewGameObjects();
            this.removeOldGameObjects();
        
            // first update all the game objects
            for (var x = 0; x < this.gameObjects.length; ++x)
            {
                if (this.gameObjects[x].update)
                {
                    this.gameObjects[x].update(dt, this.backBufferContext2D, this.xScroll, this.yScroll);
                }
            }

            // then draw the game objects
            for (var x = 0; x < this.gameObjects.length; ++x)
            {
                if (this.gameObjects[x].draw)
                {
                    this.gameObjects[x].draw(dt, this.backBufferContext2D, this.xScroll, this.yScroll);
                }
            }

            // copy the back buffer to the displayed canvas
            this.context2D.drawImage(this.backBuffer, 0, 0);
        }        
    };

    this.shutdownAll = function()
    {
        for (var x = 0; x < this.gameObjects.length; ++x)
        {
            if (this.gameObjects[x].shutdown)
            {
                this.gameObjects[x].shutdown();
            }
        }

        this.removeOldGameObjects();
    }
    
    /**
        Adds a new GameObject to the gameObjects collection
        @param gameObject The object to add
    */
    this.addGameObject = function(gameObject)
    {
        this.addedGameObjects.push(gameObject);
    };

    this.addNewGameObjects = function()
    {
        if (this.addedGameObjects.length != 0)
        {
            for (var x = 0; x < this.addedGameObjects.length; ++x)
            {
                this.gameObjects.push(this.addedGameObjects[x]);
            }

            this.addedGameObjects.clear();
            this.gameObjects.sort(function(a,b){return a.zOrder - b.zOrder;});
        }
    }

    /**
        Removes a GameObject from the gameObjects collection
        @param gameObject The object to remove
    */
    this.removeGameObject = function(gameObject)
    {
        this.removedGameObjects.push(gameObject);
    }

    this.removeOldGameObjects = function()
    {
        if (this.removedGameObjects.length != 0)
        {
            for (var x = 0; x < this.removedGameObjects.length; ++x)
            {
                this.gameObjects.removeObject(this.removedGameObjects[x]);
            }
            this.removedGameObjects.clear();
        }
    }

    this.keyDown = function(event)
    {
        for (var x = 0; x < this.gameObjects.length; ++x)
        {
            if (this.gameObjects[x].keyDown)
            {
                this.gameObjects[x].keyDown(event);
            }
        }
    }

    this.keyUp = function(event)
    {
        for (var x = 0; x < this.gameObjects.length; ++x)
        {
            if (this.gameObjects[x].keyUp)
            {
                this.gameObjects[x].keyUp(event);
            }
        }
    }
}

/**
    A class to represent the level
    @author <a href="mailto:matthewcasperson@gmail.com">Matthew Casperson</a>
    @class
*/
function Level()
{
    this.blocks = new Array();
    this.powerups = new Object;
    this.blockWidth = 64;
    this.blockHeight = 48;

    /**
        Initialises this object
    */
    this.startupLevel = function(canvasWidth, canvasHeight)
    {
        this.blocks[0] = 3;
        this.blocks[1] = 2;
        this.blocks[2] = 1;
        this.blocks[3] = 1;
        this.blocks[4] = 1;
        this.blocks[5] = 1;
        this.blocks[6] = 2;
        this.blocks[7] = 3;
        this.blocks[8] = 2;
        this.blocks[9] = 1;
        this.blocks[10] = 2;
        this.blocks[11] = 3;
        this.blocks[12] = 4;
        this.blocks[13] = 5;
        this.blocks[14] = 4;
        this.blocks[15] = 3;

        this.powerups['1'] = 'Gem';
        this.powerups['6'] = 'Gem';
        this.powerups['10'] = 'Gem';
        this.powerups['14'] = 'LevelEndPost';

        this.addBlocks(canvasWidth, canvasHeight);
        this.addPowerups(canvasWidth, canvasHeight);

        return this;
    }

    /**
        Adds the blocks to the screen by creating VisualGameObjects
    */
    this.addBlocks = function(canvasWidth, canvasHeight)
    {
        for (var x = 0; x < this.blocks.length; ++x)
        {
            for (var y = 0; y < this.blocks[x]; ++y)
            {
                new VisualGameObject().startupVisualGameObject(g_ResourceManager.block, x * this.blockWidth, canvasHeight - (y + 1) * this.blockHeight, 4);
            }
        }
    }

    this.addPowerups = function(canvasWidth, canvasHeight)
    {
        for (var x = 0; x < this.blocks.length; ++x)
        {
            if (this.powerups[x])
            {
                var xPosition = x * this.blockWidth + this.blockWidth / 2;
                var yPosition = canvasHeight - this.groundHeight(x);

                switch(this.powerups[x])
                 {
                    case 'Gem':
                        new Powerup().startupPowerup(10, g_ResourceManager.gem, xPosition - g_ResourceManager.gem.width / 2, yPosition - g_ResourceManager.gem.height, 4, 1, 1);
                        break;
                    case 'LevelEndPost':
                        new LevelEndPost().startupLevelEndPost(g_ResourceManager.portal, xPosition - g_ResourceManager.portal.width / 2 / 4, yPosition - g_ResourceManager.portal.height, 4);
                        break;
                 }
            }
        }
    }

    /**
        @return     The block under the specified x position
        @param x    The x position to test
    */
    this.currentBlock = function(x)
    {
        return parseInt( x / this.blockWidth);
    }
    
    /**
        @return             The hieght of the ground under the specified block
        @param blockIndex   The block number
    */
    this.groundHeight = function(blockIndex)
    {
        if (blockIndex < 0 || blockIndex > this.blocks.length) return 0;

        return this.blocks[blockIndex] *  this.blockHeight;
    }
}

/**
    An object that causes the level to end when it it touched
    @author <a href="mailto:matthewcasperson@gmail.com">Matthew Casperson</a>
    @class
*/
function LevelEndPost()
{

    this.startupLevelEndPost = function(/**Image*/ image, /**Number*/ x, /**Number*/ y, /**Number*/ z)
    {
        this.startupAnimatedGameObject(image, x, y, z, 4, 10);
        return this;
    }

    this.shutdown = function()
    {
        this.shutdownLevelEndPost();
    }

    this.shutdownLevelEndPost = function()
    {
        this.shutdownAnimatedGameObject();
    }

    /**
        Updates the object
        @param dt The time since the last frame in seconds
        @param context The drawing context
        @param xScroll The global scrolling value of the x axis
        @param yScroll The global scrolling value of the y axis
    */
	this.update = function (/**Number*/ dt, /**CanvasRenderingContext2D*/context, /**Number*/ xScroll, /**Number*/ yScroll)
    {
        if (this.collisionArea().intersects(g_player.collisionArea()))
        {
            g_ApplicationManager.openMainMenu();
            this.shutdown();            
        }
    }
}
LevelEndPost.prototype = new AnimatedGameObject;

/**
    The main menu screen
    @author <a href="mailto:matthewcasperson@gmail.com">Matthew Casperson</a>
    @class
*/
function MainMenu()
{
    this.startupMainMenu = function()
    {
        this.startupVisualGameObject(g_ResourceManager.mainmenu, 0, 0, 1);
        return this;
    }

    /**
        Called when a key is pressed
        @param event Event Object
    */
    this.keyDown = function(event)
    {
        g_ApplicationManager.startLevel();
    }
}
MainMenu.prototype = new VisualGameObject;

/**
    A class to represent the player on the screen
    @author <a href="mailto:matthewcasperson@gmail.com">Matthew Casperson</a>
    @class
*/
function Player()
{
    /** The maximum height of the jump
        @type Number
     */
    this.jumpHeight = 64;
    /** The constant or half PI
        @type Number
     */
    this.halfPI = Math.PI / 2;
    /** The amount of time to spend in the air when jumping
        @type Number
     */
    this.jumpHangTime = 0.5;
    /** The speed to progress alone the sine wave that defines
        the jumping arc
        @type Number
     */
    this.jumpSinWaveSpeed = this.halfPI / this.jumpHangTime;
    /** The current position on the sine wave that defines the jump arc
        @type Number
     */
    this.jumpSinWavePos = 0;
    /** The rate to fall at
        @type Number
     */
    this.fallMultiplyer = 1.5;
    /** True when the player is on the ground, false otherwise
        @type Boolean
     */
    this.grounded = true;
    /** the players running speed
        @type Number
     */
    this.speed = 75;
    /** True if the player is moving left, false otherwise
        @type Boolean
     */
    this.left = false;
    /** True if the player is moving right, false otherwise
        @type Boolean
     */
    this.right = false;
    /** A reference to the level object
        @type Level
    */
    this.level = null;
    /** The distance between the player and the edge of the screen
        @type Number
     */
    this.screenBorder = 100;

    /**
        Initialises this object
    */
    this.startupPlayer = function(level)
    {
        this.startupAnimatedGameObject(g_ResourceManager.idleLeft, 300, 400 - 48 - 48, 4, 6, 20);
        this.level = level;
        return this;
    }

    /**
        Called when a key is pressed
        @param event Event Object
    */
    this.keyDown = function(event)
    {
        var updateRequired = false;

        // left
        if (event.keyCode == 37 && !this.left)
        {
            this.left = true;
            updateRequired = true;
        }
        // right
        if (event.keyCode == 39 && !this.right)
        {
            this.right = true;
            updateRequired = true;
        }
        if (event.keyCode == 32 && this.grounded)
        {
            this.grounded = false;
            this.jumpSinWavePos = 0;
        }

        if (updateRequired)
            this.updateAnimation();

    }

    /**
        Called when a key is pressed
        @param event Event Object
    */
    this.keyUp = function(event)
    {
        // left
        if (event.keyCode == 37)
        {
            this.left = false;
            this.setAnimation(g_ResourceManager.idleLeft, 6, 20);
        }
        // right
        if (event.keyCode == 39)
        {
            this.right = false;
            this.setAnimation(g_ResourceManager.idleRight, 6, 20);
        }

        this.updateAnimation();
    }

    /**
        Updates the current animation depending on the movement
        of the player. This accounts for the fact that both
        the left and right arrow keys can be pressed at the
        same time.
    */
    this.updateAnimation = function()
    {
       if (this.right && this.left)
            this.setAnimation(g_ResourceManager.idleLeft, 6, 20);
        else if (this.right)
            this.setAnimation(g_ResourceManager.runRight, 12, 20);
        else if (this.left)
            this.setAnimation(g_ResourceManager.runLeft, 12, 20);
    }

    /**
        Updates the object
        @param dt The time since the last frame in seconds
        @param context The drawing context
        @param xScroll The global scrolling value of the x axis
        @param yScroll The global scrolling value of the y axis
    */
	this.update = function (/**Number*/ dt, /**CanvasRenderingContext2D*/context, /**Number*/ xScroll, /**Number*/ yScroll)
    {
        if (this.left)
            this.x -= this.speed * dt;
        if (this.right)
            this.x += this.speed * dt;

        // XOR operation (JavaScript does not have a native XOR operator)
        // only test for a collision if the player is moving left or right (and not trying to do both at
        // the same time)
        if ((this.right || this.left) && !(this.left && this.right))
        {
            // this will be true until the player is no longer colliding
            var collision = false;
            // the player may have to be pushed back through several block stacks (especially if the
            // frame rate is very slow)
            do
            {
                // the current position of the player (test the left side if running left
                // and the right side if running right)
                var xPos = this.left ? this.x : this.x + this.frameWidth;
                // the index of stack of blocks that the player is standing on/in
                var currentBlock = this.level.currentBlock(xPos);
                // the height of the stack of blocks that the player is standing on/in
                var groundHeight = this.level.groundHeight(currentBlock);
                // the height of the player (we need the height from the ground up,
                // whereas the this.y value represents the position of the player
                // from the "sky" down).
                var playerHeight = context.canvas.height - (this.y + this.image.height);
                // if the player is not higher than the stack of blocks, it must be colliding
                if (playerHeight  < groundHeight)
                {
                    collision = true;
                    // we are moving right, so push the player left
                    if (this.right)
                        this.x = this.level.blockWidth * currentBlock - this.frameWidth - 1;
                    // we are moving left, push the player right
                    else
                        this.x = this.level.blockWidth * (currentBlock + 1);
                }
                else
                {
                    collision = false;
                }
            }  while (collision)
        }

        // keep the player bound to the level
        if (this.x > this.level.blocks.length * this.level.blockWidth - this.frameWidth - 1)
            this.x = this.level.blocks.length * this.level.blockWidth - this.frameWidth - 1;
        if (this.x > context.canvas.width - this.frameWidth + xScroll -  this.screenBorder)
            g_GameObjectManager.xScroll = this.x - (context.canvas.width - this.frameWidth -  this.screenBorder);
        // modify the xScroll value to keep the player on the screen
        if (this.x < 0)
            this.x = 0;
        if (this.x -  this.screenBorder < xScroll)
            g_GameObjectManager.xScroll = this.x - this.screenBorder;

        // if the player is jumping or falling, move along the sine wave
        if (!this.grounded)
        {
            // the last position on the sine wave
            var lastHeight = this.jumpSinWavePos;
            // the new position on the sine wave
            this.jumpSinWavePos += this.jumpSinWaveSpeed * dt;

            // we have fallen off the bottom of the sine wave, so continue falling
            // at a predetermined speed
            if (this.jumpSinWavePos >= Math.PI)
                 this.y += this.jumpHeight / this.jumpHangTime * this.fallMultiplyer * dt;
            // otherwise move along the sine wave
            else
                this.y -= (Math.sin(this.jumpSinWavePos) - Math.sin(lastHeight)) * this.jumpHeight;
        }

        // now that the player has had it's y position changed we need to check for a collision
        // with the ground below the player. we have to check both the players left and right sides
        // for a collision with the ground

        // left side
        var currentBlock1 = this.level.currentBlock(this.x);
        // right side
        var currentBlock2 = this.level.currentBlock(this.x + this.frameWidth);
        // ground height below the left side
        var groundHeight1 = this.level.groundHeight(currentBlock1);
        // ground height below the right side
        var groundHeight2 = this.level.groundHeight(currentBlock2);
        // the heighest point under the player
        var maxGroundHeight = groundHeight1 > groundHeight2 ? groundHeight1 : groundHeight2;
        // the players height (relaitive to the bottom of the screen)
        var playerHeight = context.canvas.height - (this.y + this.image.height);

        // we have hit the ground
        if (maxGroundHeight >= playerHeight)
        {
            this.y = context.canvas.height - maxGroundHeight - this.image.height;
            this.grounded = true;
            this.jumpSinWavePos = 0;
        }
        // otherwise we are falling
        else if (this.grounded)
        {
            this.grounded = false;
            // starting falling down the sine wave (i.e. from the top)
            this.jumpSinWavePos = this.halfPI;
        }
    }
}

Player.prototype = new AnimatedGameObject;

/**
    Represents a powerup in the game
    @author <a href="mailto:matthewcasperson@gmail.com">Matthew Casperson</a>
    @class
*/
function Powerup()
{
    /** The value of the powerup
        @type Number
     */
    this.value = 0;
    /** The current position on the sine wave
        @type Number
     */
    this.sineWavePos = 0;
    /** How quickly the powerup cycles through the sine wave
        @type Number
     */
    this.bounceTime = 1;
    /** The speed to increment the sineWavePos value at
        @type Number
     */
    this.bounceSpeed = Math.PI / this.bounceTime;
    /** The height of the powerups bounce
        @type Number
     */
    this.bounceHeight = 10;

    /**
        Initialises this object
        @param value        The value (score) of this powerup
        @param image        The image to be displayed
        @param x            The position on the X axis
        @param y            The position on the Y axis
        @param z            The depth
        @param frameCount   The number of animation frames in the image
        @param fps          The frames per second to animate this object at
     */
    this.startupPowerup = function(/**Number*/ value, /**Image*/ image, /**Number*/ x, /**Number*/ y, /**Number*/ z, /**Number*/ frameCount, /**Number*/ fps)
    {
        this.startupAnimatedGameObject(image, x, y - this.bounceHeight, z, frameCount, fps);
        this.value = value;
        return this;
    }

    this.shutdownPowerup = function()
    {
        this.shutdownAnimatedGameObject();
    }

    this.shutdown = function()
    {
        this.shutdownPowerup();
    }

    /**
        Updates the object
        @param dt The time since the last frame in seconds
        @param context The drawing context
        @param xScroll The global scrolling value of the x axis
        @param yScroll The global scrolling value of the y axis
    */
	this.update = function (/**Number*/ dt, /**CanvasRenderingContext2D*/context, /**Number*/ xScroll, /**Number*/ yScroll)
    {
        var lastSineWavePos = this.sineWavePos;
        this.sineWavePos += this.bounceSpeed * dt;
        this.y += (Math.sin(this.sineWavePos) - Math.sin(lastSineWavePos)) * this.bounceHeight;

        if (this.collisionArea().intersects(g_player.collisionArea()))
        {
            this.shutdown();
            g_score += this.value;
            g_ApplicationManager.updateScore();
        }
    }
}

Powerup.prototype = new AnimatedGameObject;

/**
    A rectangle
    @author <a href="mailto:matthewcasperson@gmail.com">Matthew Casperson</a>
    @class
*/
function Rectangle()
{
    this.left = 0;
    this.top = 0;
    this.width = 0;
    this.height = 0;

    /**
        Initialises the object
        @param left     Left position
        @param top      Top Position
        @param width    Width of rectangle
        @param height   Height of triangle
     */
    this.startupRectangle = function(/**Number*/ left, /**Number*/ top, /**Number*/ width, /**Number*/ height)
    {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
        return this;
    }

    /**
        @return         true if there is an intersection, false otherwise
        @param other    The other rectangle to test against
     */
    this.intersects = function(/**Rectangle*/ other)
    {
        if (this.left + this.width < other.left)
            return false;
        if (this.top + this.height < other.top)
            return false;
        if (this.left > other.left + other.width)
            return false;
        if (this.top > other.top + other.height)
            return false;

        return true;
    }
}

/**
    A class that display a repeating texture that can optionall be offset in either
	the x or y axis
    @author <a href="mailto:matthewcasperson@gmail.com">Matthew Casperson</a>
    @class
*/
function RepeatingGameObject()
{
    /** The width that the final image will take up
		@type Number
	*/
	this.width = 0;
	/** The height that the final image will take up
		@type Number
	*/
    this.height = 0;
	/** How much of the scrollX and scrollY to apply when drawing
		@type Number
	*/
    this.scrollFactor = 1;
	
    /**
        Initialises this object
        @return A reference to the initialised object
    */
    this.startupRepeatingGameObject = function(image, x, y, z, width, height, scrollFactor)
    {
        this.startupVisualGameObject(image, x, y, z);
        this.width = width;
        this.height = height;
        this.scrollFactor = scrollFactor;
        return this;
    }
	
    /**
        Clean this object up
    */
    this.shutdownstartupRepeatingGameObject = function()
    {
        this.shutdownVisualGameObject();
    }
    
	/**
        Draws this element to the back buffer
        @param dt Time in seconds since the last frame
		@param context The context to draw to
		@param xScroll The global scrolling value of the x axis  
		@param yScroll The global scrolling value of the y axis  
    */
    this.draw = function(dt, canvas, xScroll, yScroll)
    {
        var areaDrawn = [0, 0];
        
        for (var y = 0; y < this.height; y += areaDrawn[1])
        {
            for (var x = 0; x < this.width; x += areaDrawn[0])
            {
                // the top left corner to start drawing the next tile from
				var newPosition = [this.x + x, this.y + y];
				// the amount of space left in which to draw
                var newFillArea = [this.width - x, this.height - y];
				// the first time around you have to start drawing from the middle of the image
				// subsequent tiles alwyas get drawn from the top or left
                var newScrollPosition = [0, 0];
                if (x==0) newScrollPosition[0] = xScroll * this.scrollFactor;
                if (y==0) newScrollPosition[1] = yScroll * this.scrollFactor;
                areaDrawn = this.drawRepeat(canvas, newPosition, newFillArea, newScrollPosition);
            }
        }
    }
    
    this.drawRepeat = function(canvas, newPosition, newFillArea, newScrollPosition)
    {
        // find where in our repeating texture to start drawing (the top left corner)
        var xOffset = Math.abs(newScrollPosition[0]) % this.image.width;
        var yOffset = Math.abs(newScrollPosition[1]) % this.image.height;
        var left = newScrollPosition[0]<0?this.image.width-xOffset:xOffset;
        var top = newScrollPosition[1]<0?this.image.height-yOffset:yOffset;
        var width = newFillArea[0] < this.image.width-left?newFillArea[0]:this.image.width-left;
        var height = newFillArea[1] < this.image.height-top?newFillArea[1]:this.image.height-top;
        
        // draw the image
        canvas.drawImage(this.image, left, top, width, height, newPosition[0], newPosition[1], width, height);
        
        return [width, height];
    }
    
    
}
RepeatingGameObject.prototype = new VisualGameObject();

/**
    A database for the external resources used by the game
    @author <a href="mailto:matthewcasperson@gmail.com">Matthew Casperson</a>
    @class
*/
function ResourceManager()
{
	/** An array of the names of the images supplied to the startupResourceManager
		function. Since the images are referenced by creating new properties
		of the ResourceManager class this collection allows a developer to 
		know which of the ResourceManager properties are images, and (by 
		elimination) those that are not
		@type Array
	*/
    this.imageProperties = null;

	/**
        Initialises this object
		@param images	An array of objects with the name and src properties
        @return 		A reference to the initialised object
    */
    this.startupResourceManager = function(/**Array*/ images)
    {
        // set the global variable
		g_ResourceManager = this;

        // initialize internal state.
        this.imageProperties = new Array();

        // for each image, call preload()
        for ( var i = 0; i < images.length; i++ )
		{
			// create new Image object and add to array
			var thisImage = new Image;
			this[images[i].name] = thisImage;
			this.imageProperties.push(images[i].name);

			// assign the .src property of the Image object
			thisImage.src = images[i].src;
		}

        return this;
    }
}

/** target frames per second  
    @type Number
*/
var FPS = 30;
/** time between frames 
    @type Number
*/
var SECONDS_BETWEEN_FRAMES = 1 / FPS;
/** A global reference to the GameObjectManager instance  
    @type GameObjectManager
*/
var g_GameObjectManager = null;
/** A global reference to the ApplicationManager instance  
    @type ApplicationManager
*/
var g_ApplicationManager = null;
/** A global reference to the ResourceManager instance
    @type ResourceManager
*/
var g_ResourceManager = null;
/** The players score
    @type Number
 */
var g_score = 0;
/** A reference to the player
    @type Player    
 */
var g_player = null;
/** An image to be used by the application
    @type Image
*/

// The entry point of the application is set to the init function
window.onload = init;

/**
    Application entry point
*/
function init()
{
    new GameObjectManager().startupGameObjectManager();
}

