class App {
    constructor(config) {
        config.screenshots.addEventListener('screenshot', () => {
            console.log('ss');
            const data = config.capture.screenshot();
            const canvas = document.createElement('canvas');
            canvas.width = data.width;
            canvas.height = data.height;
            const context = canvas.getContext("2d");
            context.putImageData(data, 0, 0);
            const image = document.createElement('img');
            image.src = canvas.toDataURL('image/png');
            config.screenshots.addScreenshot(image);
        });
    }
}
((script, init) => {
    if (document.readyState !== 'loading') {
        return init(script);
    }
    document.addEventListener('DOMContentLoaded', () => { init(script); });
})(document.currentScript, (script) => {
    class DeviceManager {
        init() {
            this.camera = [];
            this.mike = [];
            this.devices = {};
        }
        add(info) {
            if (info.kind === 'videoinput') {
                this.camera.push(info);
                if (!this.devices[info.groupId]) {
                    this.devices[info.groupId] =
                        {
                            camera: [],
                            mike: [],
                        };
                }
                this.devices[info.groupId].camera.push(info);
            }
            else if (info.kind === 'audioinput') {
                this.mike.push(info);
                if (!this.devices[info.groupId]) {
                    this.devices[info.groupId] =
                        {
                            camera: [],
                            mike: [],
                        };
                }
                this.devices[info.groupId].mike.push(info);
            }
        }
        getCameras() { return this.camera; }
        getMikes() { return this.mike; }
        getDevices() { return this.devices; }
        getVideos() {
            return Object.keys(this.devices).map((deviceId) => {
                return this.devices[deviceId];
            }).filter((device) => {
                return 0 < device.camera.length && 0 < device.mike.length;
            });
        }
    }
    class SelectSupport {
        static clear(select) {
            for (let i = select.children.length - 1; 0 <= i; --i) {
                select.removeChild(select.children[i]);
            }
            return select;
        }
        static create(className) {
            const select = document.createElement('select');
            select.classList.add(className);
            return select;
        }
        static option(label, value, selected) {
            const option = document.createElement('option');
            option.textContent = label;
            option.value = value;
            if (selected) {
                option.selected = true;
            }
            return option;
        }
    }
    function prime(n) {
        const list = [];
        [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47].forEach((p) => {
            while (n % p === 0) {
                list.push(p);
                n /= p;
                if (n <= 1) {
                    break;
                }
            }
        });
        if (1 < n) {
            list.push(n);
        }
        return list;
    }
    ((component, tagname = 'webcam-capture') => {
        if (customElements.get(tagname)) {
            return;
        }
        customElements.define(tagname, component);
    })(class extends HTMLElement {
        constructor() {
            super();
            const style = document.createElement('style');
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
                ].join('');
            this.device = new DeviceManager();
            this.video = document.createElement('video');
            this.video.autoplay = true;
            this.canvas = document.createElement('canvas');
            this.info = this.initInfo();
            const start = document.createElement('div');
            start.classList.add('start');
            start.addEventListener('click', () => {
                this.init().then(() => {
                    this.setupDevice();
                    contents.removeChild(start);
                    console.log(this.device.getDevices());
                });
            });
            const contents = document.createElement('div');
            contents.appendChild(this.video);
            contents.appendChild(this.canvas);
            contents.appendChild(this.info);
            contents.appendChild(start);
            this.shadow = this.attachShadow({ mode: 'open' });
            this.shadow.appendChild(style);
            this.shadow.appendChild(contents);
        }
        init() {
            this.device.init();
            return navigator.mediaDevices.getUserMedia({ audio: true, video: true }).catch(() => { }).then(() => {
                return navigator.mediaDevices.enumerateDevices().then((mediaDevices) => {
                    for (let i = 0; i < mediaDevices.length; ++i) {
                        this.device.add(mediaDevices[i]);
                    }
                });
            });
        }
        initInfo() {
            const selectVideo = SelectSupport.create('videos');
            selectVideo.style.gridArea = '1 / 1 / 1 / 3';
            selectVideo.addEventListener('change', () => {
                const index = parseInt(selectVideo.selectedOptions[0].value);
                this.onSelectVideo(index);
            });
            const width = document.createElement('input');
            width.classList.add('width');
            width.type = 'number';
            width.value = '1280';
            const height = document.createElement('input');
            height.classList.add('height');
            height.type = 'number';
            height.value = '720';
            const selectScreen = SelectSupport.create('screen');
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
            ].forEach((data) => {
                const p1 = prime(data.w);
                const p2 = prime(data.h);
                for (let a = 0; a < p1.length;) {
                    let del = false;
                    for (let b = 0; b < p2.length; ++b) {
                        if (p1[a] == p2[b]) {
                            del = true;
                            p1.splice(a, 1);
                            p2.splice(b, 1);
                            break;
                        }
                    }
                    if (!del) {
                        ++a;
                    }
                }
                const w = p1.reduce((total, value) => { return total * value; }, 1);
                const h = p2.reduce((total, value) => { return total * value; }, 1);
                selectScreen.appendChild(SelectSupport.option(`${data.w}x${data.h} - ${w}:${h}`, data.w + 'x' + data.h, data.selected));
                if (data.selected) {
                    width.value = data.w + '';
                    height.value = data.h + '';
                }
            });
            selectScreen.addEventListener('change', () => {
                const val = (selectScreen.selectedOptions[0].value || '0x0').split('x');
                width.value = val[0] + '';
                height.value = val[1] + '';
            });
            const button = document.createElement('button');
            button.style.gridArea = '5 / 1 / 5 / 3';
            button.textContent = 'Start';
            button.addEventListener('click', () => {
                info.classList.add('hidden');
                this.setupVideo();
            });
            const videoBlock = document.createElement('div');
            videoBlock.style.display = 'grid';
            videoBlock.style.gridTemplateColumns = '50% 50%';
            videoBlock.style.gridTemplateRows = '1fr 1fr 1fr 1fr 1fr';
            videoBlock.appendChild(selectVideo);
            videoBlock.appendChild(SelectSupport.create('videoCameras'));
            videoBlock.appendChild(SelectSupport.create('videoMikes'));
            videoBlock.appendChild(selectScreen);
            videoBlock.appendChild(width);
            videoBlock.appendChild(height);
            videoBlock.appendChild(button);
            const info = document.createElement('div');
            info.classList.add('info');
            info.appendChild(videoBlock);
            return info;
        }
        setupDevice() {
            const videos = SelectSupport.clear(this.shadow.querySelector('select.videos'));
            const videoCameras = SelectSupport.clear(this.shadow.querySelector('select.videoCameras'));
            const videoMikes = SelectSupport.clear(this.shadow.querySelector('select.videoMikes'));
            const devices = this.device.getVideos();
            videos.appendChild(SelectSupport.option('All', '-1'));
            devices.forEach((video, index) => {
                videos.appendChild(SelectSupport.option(video.camera[0].label, index + ''));
            });
            this.onSelectVideo = (index) => {
                SelectSupport.clear(videoCameras);
                SelectSupport.clear(videoMikes);
                if (index < 0 || !devices[index]) {
                    this.device.getCameras().forEach((camera) => {
                        videoCameras.appendChild(SelectSupport.option(camera.label, camera.deviceId));
                    });
                    this.device.getMikes().forEach((mike) => {
                        videoMikes.appendChild(SelectSupport.option(mike.label, mike.deviceId));
                    });
                    return;
                }
                const video = devices[index];
                video.camera.forEach((camera) => {
                    videoCameras.appendChild(SelectSupport.option(camera.label, camera.deviceId));
                });
                video.mike.forEach((mike) => {
                    videoMikes.appendChild(SelectSupport.option(mike.label, mike.deviceId));
                });
            };
            this.onSelectVideo(-1);
        }
        getDeviceId(select) {
            return select.selectedOptions[0].value;
        }
        setupVideo() {
            const cameraId = this.getDeviceId(this.shadow.querySelector('select.videoCameras'));
            const mikeId = this.getDeviceId(this.shadow.querySelector('select.videoMikes'));
            const width = parseInt(this.shadow.querySelector('input.width').value);
            const height = parseInt(this.shadow.querySelector('input.height').value);
            console.log(width, height);
            return navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: mikeId } },
                video: { deviceId: { exact: cameraId }, width: { min: width }, height: { min: height }, frameRate: 30 },
            }).then((stream) => {
                const tracks = stream.getVideoTracks();
                tracks.forEach((track) => {
                    console.log(track.getSettings());
                });
                this.video.srcObject = stream;
                this.updateSize(this.video.width, this.video.height);
            }).catch((error) => {
                console.log(error);
            });
        }
        updateSize(width, height) {
            if (!width) {
                width = parseInt(this.shadow.querySelector('input.width').value);
            }
            else {
                this.shadow.querySelector('input.width').value = width + '';
            }
            if (!height) {
                height = parseInt(this.shadow.querySelector('input.height').value);
            }
            else {
                this.shadow.querySelector('input.height').value = height + '';
            }
            this.canvas.width = width;
            this.canvas.height = height;
        }
        get width() { return this.canvas.width; }
        get height() { return this.canvas.height; }
        getSize() { return { width: this.canvas.width, height: this.canvas.height }; }
        screenshot(x, y, width, height) {
            const context = this.canvas.getContext('2d');
            context.drawImage(this.video, 0, 0, this.width, this.height);
            return context.getImageData(x || 0, y || 0, width || this.width, height || this.height);
        }
    });
});
((script, init) => {
    if (document.readyState !== 'loading') {
        return init(script);
    }
    document.addEventListener('DOMContentLoaded', () => { init(script); });
})(document.currentScript, (script) => {
    ((component, tagname = 'screenshot-list') => {
        if (customElements.get(tagname)) {
            return;
        }
        customElements.define(tagname, component);
    })(class extends HTMLElement {
        constructor() {
            super();
            const style = document.createElement('style');
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
                ].join('');
            const button = document.createElement('button');
            button.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('screenshot'));
            });
            this.images = document.createElement('div');
            const contents = document.createElement('div');
            contents.appendChild(button);
            contents.appendChild(this.images);
            const shadow = this.attachShadow({ mode: 'open' });
            shadow.appendChild(style);
            shadow.appendChild(contents);
        }
        addScreenshot(image) {
            const block = document.createElement('div');
            block.appendChild(image);
            block.addEventListener('click', (event) => {
                if (event.composedPath()[0] !== block) {
                    return;
                }
                this.images.removeChild(block);
            });
            this.images.insertBefore(block, this.images.children[0]);
        }
    });
});
document.addEventListener('DOMContentLoaded', () => {
    const app = new App({
        capture: document.querySelector('web-capture'),
        screenshots: document.querySelector('screenshot-list'),
    });
});
