interface ScreenshotListElement extends HTMLElement
{
    addEventListener( type: 'screenshot', listener: ( event: Event ) => any, options?: boolean | AddEventListenerOptions ): void;
    addScreenshot( image: HTMLImageElement ): void;
}

( ( script, init ) =>
{
	if ( document.readyState !== 'loading' ) { return init( script ); }
	document.addEventListener( 'DOMContentLoaded', () => { init( script ); } );
} )( <HTMLScriptElement>document.currentScript, ( script: HTMLScriptElement ) =>
{
    ( ( component, tagname = 'screenshot-list' ) =>
    {
        if ( customElements.get( tagname ) ) { return; }
        customElements.define( tagname, component );
    } )( class extends HTMLElement implements ScreenshotListElement
    {
        private images: HTMLElement;

        constructor()
        {
            super();

            const style = document.createElement( 'style' );
            style.textContent =
            [
                ':host { display: block; width: 100%; height: var( --button-size ); overflow: hidden; --button-size: 2rem; --back-color: #272727; --front-color: white; --close-size: 0.5rem; --close-text-size: 0.25ren; --close-front-color: #fff; --close-back-color: rgba(255,255,255,0.3); }',
                ':host > div { display: grid; grid-template-columns: var( --button-size ) 1fr; grid-template-rows: var( --button-size ); }',
                ':host > div > div { overflow-x: auto; overflow-y: none; display: flex; }',
                ':host > div > div > div { position: relative; display: block; height: 100%; }',
                ':host > div > div > div:hover::after { position: absolute; content: "✕"; top: 0; right: 0; color: var( --close-front-color ); font-size: var( --close-text-size ); background: var( --close-back-color ); width: var( --close-size ); height: var( --close-size ); border-radius: 50%; text-align: center; line-height: var( --close-size ); cursor: pointer; }',
                'img { width: auto; height: 100%; border: none; display: block; }',
                'button { cursor: pointer; font-size: 1rem; display: block; box-sizing: border-box; width: var( --button-size ); height: var( --button-size ); line-height: var( --button-size ); }',
                'button::after { content: "📷"; display: inline; }',
            ].join( '' );

            const button = document.createElement( 'button' );
            button.addEventListener( 'click', () =>
            {
                this.dispatchEvent( new CustomEvent( 'screenshot' ) );
            } );
            this.images = document.createElement( 'div' );

            const contents = document.createElement( 'div' );
            contents.appendChild( button );
            contents.appendChild( this.images );

            const shadow = this.attachShadow( { mode: 'open' } );
            shadow.appendChild( style );
            shadow.appendChild( contents );
        }

        public addScreenshot( image: HTMLImageElement )
        {
            const block = document.createElement( 'div' );
            block.appendChild( image );
            block.addEventListener( 'click', ( event: MouseEvent ) =>
            {
                if ( event.composedPath()[ 0 ] !== block ) { return; }
                this.images.removeChild( block );
            } );
            this.images.insertBefore( block, this.images.children[ 0 ] );
        }
    } );
} );
