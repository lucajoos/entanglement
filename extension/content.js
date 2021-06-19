(() => {
    window.addEventListener('load', () => {
        let currentLocation = window.location.href;

        if(!window?.io) {
            throw new Error('Socket.io not initialized globally');
        }

        const socket = window.io('http://127.0.0.1:4001');

        let observe = (selector, options) => {
            return new Promise((rs, rj) => {
                let ar = false;

                if(typeof selector !== 'string') {
                    rj('No selector specified.');
                }

                let observer = new MutationObserver((mutations, self) => {
                    let element = document.querySelector(selector);

                    if(!options?.isInverted ? element : (!element && ar)) {
                        rs(element);
                        self.disconnect();
                        return true;
                    }

                    ar = true;
                });

                observer.observe(document, {
                    childList: true,
                    subtree: true
                });

                if(typeof options?.run === 'function') {
                    options?.run();
                }
            });
        };

        let resolve = async () => {
            let meta = {
                isResolved: false
            };

            if(
                window.location.href.startsWith('https://www.netflix.com/watch/')
            ) {
                const information = await observe('.ellipsize-text');
                let title;

                meta.additional = '';

                if(information.tagName === 'DIV') {
                    title = information.querySelector('h4');
                    meta.additional = [ ...information.querySelectorAll('span') ].map(element => element.innerHTML).join(' ');
                    meta.type = 1;
                } else {
                    title = information;
                    meta.type = 0;
                }

                meta.title = title.innerHTML || 'Unknown';
                meta.provider = 'Netflix';
                meta.isResolved = true;
            } else if(
                window.location.href.startsWith('https://www.disneyplus.com/video/')
            ) {
                await observe('video');

                const title = await observe('div.title-field', () => {
                    document.dispatchEvent(new Event('mousemove'));
                });

                meta.title = title.innerHTML || 'Unknown';
                meta.additional = document.querySelector('.subtitle-field')?.innerHTML || '';
                meta.type = document.querySelector('.subtitle-field')?.innerHTML ? 1 : 0;
                meta.provider = 'Disney+';
                meta.isResolved = true;
            } else if(
                window.location.href.startsWith('https://www.youtube.com/watch?v=')
            ) {
                const title = await observe('#container > h1 > yt-formatted-string');
                const additional = await observe('#text > a');

                meta.title = title.textContent || 'Unknown';
                meta.additional = additional.innerHTML || '';
                meta.type = 0;
                meta.provider = 'YouTube';
                meta.isResolved = true;
            } else if(
                window.location.href.startsWith('https://www.amazon.') &&
                document.title.startsWith('Amazon') &&
                document.title.endsWith('| Prime Video')
            ) {
                let r = async () => {
                    await observe('#dv-web-player.dv-player-fullscreen');

                    let title = await observe('div.title');

                    while (title.innerHTML?.length === 0) {
                        title = await observe('div.title');
                    }

                    meta.title = title.innerHTML || 'Unknown';
                    meta.provider = 'Amazon Prime Video';
                    meta.isResolved = true;

                    socket.emit('resolve', {
                        href: window.location.href,
                        ...meta,
                    });

                    await observe('#dv-web-player.dv-player-fullscreen', {
                        isInverted: true
                    });

                    socket.emit('resolve', {
                        href: window.location.href,
                        isResolved: false
                    });

                    await r();
                };

                await r();
            }

            socket.emit('resolve', {
                href: window.location.href,
                ...meta,
            });
        };

        socket.on('connect', () => {
            socket.emit('init', {
                type: 'extension'
            });

            setInterval(() => {
                if(currentLocation !== window.location.href) {
                    resolve();

                    currentLocation = window.location.href;
                }
            }, 2000);

            resolve();
        });
    });
})();