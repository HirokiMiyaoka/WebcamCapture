/// <reference path="./App.ts" />
/// <reference path="./components/webcam-capture.ts" />
/// <reference path="./components/screenshot-list.ts" />


document.addEventListener( 'DOMContentLoaded', () =>
{
    const app = new App(
    {
        capture: <WebCaptureElement>document.querySelector( 'web-capture' ),
        screenshots: <ScreenshotListElement>document.querySelector( 'screenshot-list' ),
    } );
} );
