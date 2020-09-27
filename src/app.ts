interface AppConfig
{
    capture: WebCaptureElement,
    screenshots: ScreenshotListElement,
}

class App
{
    constructor( config: AppConfig )
    {
        config.screenshots.addEventListener( 'screenshot', () =>
        {
            console.log( 'ss' );
            const data = config.capture.screenshot();

            const canvas = document.createElement( 'canvas' );
            canvas.width = data.width;
            canvas.height = data.height;
            const context = <CanvasRenderingContext2D>canvas.getContext("2d");
            context.putImageData( data, 0, 0 );
            const image = document.createElement( 'img' );
            image.src = canvas.toDataURL( 'image/png' );

            config.screenshots.addScreenshot( image );
        } );
    }
}
