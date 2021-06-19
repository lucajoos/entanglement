(() => {
    window.addEventListener('load', () => {
        let currentLocation = window.location.href;

        if(!window?.io) {
            throw new Error('Socket.io not initialized globally');
        }

        const socket = window.io('http://127.0.0.1:4001');

        let observe = (selector, run) => {
            return new Promise((rs, rj) => {
                if(typeof selector !== 'string') {
                    rj('No selector specified.');
                }

                let observer = new MutationObserver(function (mutations, self) {
                    let element = document.querySelector(selector);

                    if(element) {
                        rs(element);
                        self.disconnect();
                        return true;
                    }
                });

                observer.observe(document, {
                    childList: true,
                    subtree: true
                });

                if(typeof run === 'function') {
                    run();
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
                const element = await observe('h4.ellipsize-text');

                meta.title = element.innerHTML || 'Unknown';
                meta.provider = 'Netflix';
                meta.isResolved = true;
            } else if(
                window.location.href.startsWith('https://www.disneyplus.com/video/')
            ) {
                await observe('video');

                const element = await observe('div.title-field', () => {
                    document.dispatchEvent(new Event('mousemove'));
                });

                meta.title = element.innerHTML || 'Unknown';
                meta.provider = 'Disney+';
                meta.isResolved = true;
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