interface WebCaptureElement extends HTMLElement
{
    width: number;
    height: number;
    getSize(): { width: number, height: number };
    screenshot( x?: number, y?: number, width?: number, height?: number ): ImageData;
}

( ( script, init ) =>
{
	if ( document.readyState !== 'loading' ) { return init( script ); }
	document.addEventListener( 'DOMContentLoaded', () => { init( script ); } );
} )( <HTMLScriptElement>document.currentScript, ( script: HTMLScriptElement ) =>
{
    class DeviceManager
    {
        private camera: MediaDeviceInfo[];
        private mike: MediaDeviceInfo[];
        private devices: {
            [ key: string ]: {
                camera: MediaDeviceInfo[],
                mike: MediaDeviceInfo[],
            },
        };

        public init()
        {
            this.camera = [];
            this.mike = [];
            this.devices = {};
        }

        public add( info: MediaDeviceInfo )
        {
            if ( info.kind === 'videoinput' )
            {
                this.camera.push( info );
                if ( !this.devices[ info.groupId ] )
                {
                    this.devices[ info.groupId ] =
                    {
                        camera: [],
                        mike: [],
                    };
                }
                this.devices[ info.groupId ].camera.push( info );
            } else if ( info.kind === 'audioinput' )
            {
                this.mike.push( info );
                if ( !this.devices[ info.groupId ] )
                {
                    this.devices[ info.groupId ] =
                    {
                        camera: [],
                        mike: [],
                    };
                }
                this.devices[ info.groupId ].mike.push( info );
            }
        }

        public getCameras() { return this.camera; }

        public getMikes() { return this.mike; }

        public getDevices() { return this.devices; }

        public getVideos()
        {
            return Object.keys( this.devices ).map( ( deviceId ) =>
            {
                return this.devices[ deviceId ];
            } ).filter( ( device ) =>
            {
                return 0 < device.camera.length && 0 < device.mike.length;
            } );
        }
    }

    class SelectSupport
    {
        public static clear( select: HTMLSelectElement )
        {
            for ( let i = select.children.length - 1 ; 0 <= i ; --i )
            {
                select.removeChild( select.children[ i ] );
            }

            return select;
        }

        public static create( className: string )
        {
            const select = document.createElement( 'select' );
            select.classList.add( className );

            return select;
        }

        public static option( label: string, value: string, selected?: boolean )
        {
            const option = document.createElement( 'option' );
            option.textContent = label;
            option.value = value;
            if ( selected ) { option.selected = true; }

            return option;
        }
    }

    function prime( n: number )
    {
        const list: number[] = [];

        [ 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47 ].forEach( ( p ) =>
        {
            while ( n % p === 0 )
            {
                list.push( p );
                n /= p;
                if ( n <= 1 ) { break; }
            }
        } );
        if ( 1 < n ) { list.push( n ); }

        return list;
    }

    ( ( component, tagname = 'webcam-capture' ) =>
	{
		if ( customElements.get( tagname ) ) { return; }
		customElements.define( tagname, component );
	} )( class extends HTMLElement implements WebCaptureElement
	{
        private shadow: ShadowRoot;
        private video: HTMLVideoElement;
        private canvas: HTMLCanvasElement;
        private info: HTMLElement;
        private device: DeviceManager;
        private onSelectVideo: ( index: number ) => void;

        constructor()
        {
            super();

            const style = document.createElement( 'style' );
            style.textContent =
            [
                ':host { display: block; width: 100%; overflow: hidden; --back-color: #272727; --front-color: white; }',
                ':host > div { position: relative; width: 100%; height: 100%; overflow: hidden; }',
                ':host > div > div { position: absolute; width: 100%; height: 100%; top: 0; left: 0; background-color: var( --back-color ); color: var( --front-color ); }',
                '.start { cursor: pointer; display: flex; justify-content: center; align-items: center; }',
                '.start::after { content: "▶"; display: block; line-height: 2.75rem; text-align: center; width: 3rem; height: 3rem; border: 0.2rem solid var( --front-color ); border-radius: 50%; box-sizing: border-box; font-size: 1.5rem; }',
                '.info { display: flex; justify-content: center; align-items: center; }',
                '.info > div { width: 80%; }',
                'video, canvas { width: 100%; display: block; }',
                'canvas { position: absolute; opacity: 0; }',
                'select, input, button { font-size: 1rem; box-sizing: border-box; border: 1px solid; background: var( --back-color ); color: var( --front-color ); }',
                '.info.hidden { display: none; }',
                'button { cursor: pointer; }',
            ].join( '' );

            this.device = new DeviceManager();

            this.video = document.createElement('video');
            this.video.autoplay = true;

            this.canvas = document.createElement( 'canvas' );

            this.info = this.initInfo();

            const start = document.createElement( 'div' );
            start.classList.add( 'start' );
            start.addEventListener( 'click', () =>
            {
                this.init().then( () =>
                {
                    this.setupDevice();
                    contents.removeChild( start );
                    console.log(this.device.getDevices());
                } );
            } );

            const contents = document.createElement( 'div' );
            contents.appendChild( this.video );
            contents.appendChild( this.canvas );
            contents.appendChild( this.info );
            contents.appendChild( start );

            this.shadow = this.attachShadow( { mode: 'open' } );
            this.shadow.appendChild( style );
            this.shadow.appendChild( contents );
        }

        private init()
        {
            this.device.init();

            return navigator.mediaDevices.enumerateDevices().then( ( mediaDevices ) =>
            {
                for (let i = 0; i < mediaDevices.length ; ++i )
                {
                    this.device.add( mediaDevices[ i ] );
                }
            } );
        }

        private initInfo()
        {
            const selectVideo = SelectSupport.create( 'videos' );
            selectVideo.style.gridArea = '1 / 1 / 1 / 3';
            selectVideo.addEventListener( 'change', () =>
            {
                const index = parseInt( selectVideo.selectedOptions[ 0 ].value );
                this.onSelectVideo( index );
            } );

            const width = document.createElement( 'input' );
            width.classList.add( 'width' );
            width.type = 'number';
            width.value = '1280';
            const height = document.createElement( 'input' );
            height.classList.add( 'height' );
            height.type = 'number';
            height.value = '720';
            const selectScreen = SelectSupport.create( 'screen' );
            selectScreen.style.gridArea = '3 / 1 / 3 / 3';
            [
                { w: 640, h: 480 },
                { w: 720, h: 480 },
                { w: 800, h: 600 },
                { w: 1024, h: 768 },
                { w: 1280, h: 720, selected: true },
                { w: 1360, h: 768 },
                { w: 1280, h: 960 },
                { w: 1280, h: 1024 },
                { w: 1600, h: 1200 },
                { w: 1920, h: 1080 },
            ].forEach( ( data ) =>
            {
                const p1 = prime( data.w );
                const p2 = prime( data.h );
                for ( let a = 0 ; a < p1.length ; )
                {
                    let del = false;
                    for ( let b = 0 ; b < p2.length; ++b )
                    {
                        if ( p1[ a ] == p2[ b ] )
                        {
                            del = true;
                            p1.splice( a, 1 );
                            p2.splice( b, 1 );
                            break;
                        }
                    }
                    if ( !del ) { ++a; }
                }
                const w = p1.reduce( ( total, value ) => { return total * value; }, 1 );
                const h = p2.reduce( ( total, value ) => { return total * value; }, 1 );
                selectScreen.appendChild( SelectSupport.option(
                    `${ data.w }x${ data.h } - ${ w }:${ h }`,
                    data.w + 'x' + data.h,
                    data.selected
                ) );
                if ( data.selected )
                {
                    width.value = data.w + '';
                    height.value = data.h + '';
                }
            } );
            selectScreen.addEventListener( 'change', () =>
            {
                const val = ( selectScreen.selectedOptions[ 0 ].value || '0x0' ).split( 'x' );
                width.value = val[ 0 ] + '';
                height.value = val[ 1 ] + '';
            } );

            const button = document.createElement( 'button' );
            button.style.gridArea = '5 / 1 / 5 / 3';
            button.textContent = 'Start';
            button.addEventListener( 'click', () =>
            {
                info.classList.add( 'hidden' );
                this.setupVideo();
            } );

            const videoBlock = document.createElement( 'div' );
            videoBlock.style.display = 'grid';
            videoBlock.style.gridTemplateColumns = '50% 50%';
            videoBlock.style.gridTemplateRows = '1fr 1fr 1fr 1fr 1fr';
            videoBlock.appendChild( selectVideo );
            videoBlock.appendChild( SelectSupport.create( 'videoCameras' ) );
            videoBlock.appendChild( SelectSupport.create( 'videoMikes' ) );
            videoBlock.appendChild( selectScreen );
            videoBlock.appendChild( width );
            videoBlock.appendChild( height );
            videoBlock.appendChild( button );

            const info = document.createElement( 'div' );
            info.classList.add( 'info' );
            info.appendChild( videoBlock );

            return info;
        }

        private setupDevice()
        {
            const videos = SelectSupport.clear( <HTMLSelectElement>this.shadow.querySelector( 'select.videos' ) );
            const videoCameras = SelectSupport.clear( <HTMLSelectElement>this.shadow.querySelector( 'select.videoCameras' ) );
            const videoMikes = SelectSupport.clear( <HTMLSelectElement>this.shadow.querySelector( 'select.videoMikes' ) );
            const devices = this.device.getVideos();
            videos.appendChild( SelectSupport.option( 'All', '-1' ) );
            devices.forEach( ( video, index ) =>
            {
                videos.appendChild( SelectSupport.option( video.camera[ 0 ].label, index + '' ) );
            } );
            this.onSelectVideo = ( index: number ) =>
            {
                SelectSupport.clear( videoCameras );
                SelectSupport.clear( videoMikes );

                if ( index < 0 || !devices[ index ] )
                {
                    this.device.getCameras().forEach( ( camera ) =>
                    {
                        videoCameras.appendChild( SelectSupport.option( camera.label, camera.deviceId ) );
                    } );
                    this.device.getMikes().forEach( ( mike ) =>
                    {
                        videoMikes.appendChild( SelectSupport.option( mike.label, mike.deviceId ) );
                    } );
                    return;
                }

                const video = devices[ index ];
                video.camera.forEach( ( camera ) =>
                {
                    videoCameras.appendChild( SelectSupport.option( camera.label, camera.deviceId ) );
                } );
                video.mike.forEach( ( mike ) =>
                {
                    videoMikes.appendChild( SelectSupport.option( mike.label, mike.deviceId ) );
                } );
            };
            if ( 0 < devices.length ) { this.onSelectVideo( -1 ); }

        }

        private getDeviceId( select: HTMLSelectElement )
        {
            return select.selectedOptions[ 0 ].value;
        }

        private setupVideo()
        {
            const cameraId = this.getDeviceId( <HTMLSelectElement>this.shadow.querySelector( 'select.videoCameras' ) );
            const mikeId = this.getDeviceId( <HTMLSelectElement>this.shadow.querySelector( 'select.videoMikes' ) );
            const width = parseInt( (<HTMLInputElement>this.shadow.querySelector( 'input.width' )).value );
            const height = parseInt( (<HTMLInputElement>this.shadow.querySelector( 'input.height' )).value );
            console.log(width, height);
            return navigator.mediaDevices.getUserMedia(
            {
                audio: { deviceId: { exact: mikeId } },
                video: { deviceId: { exact: cameraId }, width: { min: width }, height: { min: height }, frameRate: 30 },
            } ).then( ( stream ) =>
            {
                const tracks = stream.getVideoTracks();
                tracks.forEach( ( track ) =>
                {
                    console.log( track.getSettings() );
                } );
                this.video.srcObject = stream;
                this.updateSize( this.video.width, this.video.height );
            } ).catch( ( error ) =>
            {
                console.log( error );
            } );
        }

        private updateSize( width?: number, height?: number )
        {
            if ( !width )
            {
                width = parseInt( (<HTMLInputElement>this.shadow.querySelector( 'input.width' )).value );
            } else
            {
                (<HTMLInputElement>this.shadow.querySelector( 'input.width' )).value = width + '';
            }
            if ( !height )
            {
                height = parseInt( (<HTMLInputElement>this.shadow.querySelector( 'input.height' )).value );
            } else
            {
                (<HTMLInputElement>this.shadow.querySelector( 'input.height' )).value = height + '';
            }
            this.canvas.width = width;
            this.canvas.height = height;
        }

        public get width() { return this.canvas.width; }
        public get height() { return this.canvas.height; }

        public getSize() { return { width: this.canvas.width, height: this.canvas.height } }

        public screenshot( x?: number, y?: number, width?: number, height?: number )
        {
            const context = <CanvasRenderingContext2D>this.canvas.getContext('2d');
            context.drawImage( this.video, 0, 0, this.width, this.height );

            return context.getImageData( x || 0, y || 0, width || this.width, height || this.height );
        }
    } );

} );
