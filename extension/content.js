(() => {
    window.addEventListener('load', () => {
        let currentLocation = window.location.href;

        let observerCleanups = {
            isRunning: {
                current: () => {},
                previous: () => {}
            },

            isMuted: {
                current: () => {},
                previous: () => {}
            }
        }

        if(!window?.io) {
            throw new Error('Socket.io not initialized globally');
        }

        const socket = window.io('http://127.0.0.1:4001');

        let cleanup = () => {
            [...Object.keys(observerCleanups)].forEach(key => {
                let cleanup = observerCleanups[key];

                if(typeof cleanup?.previous === 'function') {
                    cleanup.previous();
                }

                observerCleanups[key].previous = observerCleanups[key].current;
            });
        };

        let observe = (selector, callback) => {
            let r = () => {};

            if(typeof selector === 'string' && typeof callback === 'function') {
                let observer = new MutationObserver((_, self) => {
                    let element = document.querySelector(selector);

                    if(element) {
                        callback(element);
                    }
                });

                observer.observe(document.querySelector(selector), {
                    attributes: true,
                    subtree: true,
                    childList: true
                });

                r = () => {
                    observer.disconnect();
                }
            }

            return r;
        }

        let detect = (selector, options) => {
            if(typeof selector === 'string') {
                return new Promise((rs, rj) => {
                    let ar = false;

                    if(typeof selector !== 'string') {
                        rj('No selector specified.');
                    }

                    let observer = new MutationObserver((_, self) => {
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
            }
        };

        let resolve = async () => {
            cleanup();

            let isRunning = null;
            let isMuted = null;

            let meta = {
                isResolved: false
            };

            if(
                window.location.href.startsWith('https://www.netflix.com/watch/')
            ) {
                const information = await detect('.ellipsize-text');
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

                isRunning = document.querySelector('.PlayerControlsNeo__button-control-row > *:first-child')?.classList.contains('button-nfplayerPause');

                observerCleanups.isRunning.current = observe('.PlayerControlsNeo__button-control-row > *:first-child', element => {
                    let hasChanged = false;

                    if(element?.classList.contains('button-nfplayerPause') && !isRunning) {
                        hasChanged = true;
                        isRunning = true;
                    } else if(element?.classList.contains('button-nfplayerPlay') && isRunning) {
                        hasChanged = true;
                        isRunning = false;
                    }

                    if(hasChanged) {
                        socket.emit('player', {
                            isRunning: isRunning
                        });
                    }
                });

                isMuted = document.querySelector('.PlayerControlsNeo__button-control-row > *:nth-child(4) > button')?.classList.contains('button-volumeMuted');

                observerCleanups.isMuted.current = observe('.PlayerControlsNeo__button-control-row > *:nth-child(4) > button', element => {
                    let hasChanged = false;

                    if(
                        (
                            element?.classList.contains('button-volumeLow') ||
                            element?.classList.contains('button-volumeMedium') ||
                            element?.classList.contains('button-volumeMax')
                        ) &&
                        isMuted
                    ) {
                        hasChanged = true;
                        isMuted = false;
                    } else if(element?.classList.contains('button-volumeMuted') && !isMuted) {
                        hasChanged = true;
                        isMuted = true;
                    }

                    if(hasChanged) {
                        socket.emit('player', {
                            isMuted: isMuted
                        });
                    }
                });

                meta.title = title.innerHTML || 'Unknown';
                meta.provider = 'Netflix';
                meta.isResolved = true;
            } else if(
                window.location.href.startsWith('https://www.disneyplus.com/video/')
            ) {
                await detect('video');

                const title = await detect('div.title-field', () => {
                    document.dispatchEvent(new Event('mousemove'));
                });

                isRunning = document.querySelector('.control-icon-btn.play-pause-icon')?.classList.contains('pause-icon');

                observerCleanups.isRunning.current = observe('.btm-media-player', element => {
                    let hasChanged = false;

                    if(element.querySelector('.control-icon-btn.play-pause-icon')?.classList.contains('pause-icon') && !isRunning) {
                        hasChanged = true;
                        isRunning = true;
                    } else if(element.querySelector('.control-icon-btn.play-pause-icon')?.classList.contains('play-icon') && isRunning) {
                        hasChanged = true;
                        isRunning = false;
                    }

                    if(hasChanged) {
                        socket.emit('player', {
                            isRunning: isRunning
                        });
                    }
                });

                isMuted = document.querySelector('.audio-control')?.classList.contains('muted-true');

                observerCleanups.isMuted.current = observe('.audio-control', element => {
                    let hasChanged = false;

                    if(element?.classList.contains('muted-false') && isMuted) {
                        hasChanged = true;
                        isMuted = false;
                    } else if(element?.classList.contains('muted-true') && !isMuted) {
                        hasChanged = true;
                        isMuted = true;
                    }

                    if(hasChanged) {
                        socket.emit('player', {
                            isMuted: isMuted
                        });
                    }
                });

                meta.title = title.innerHTML || 'Unknown';
                meta.additional = document.querySelector('.subtitle-field')?.innerHTML || '';
                meta.type = document.querySelector('.subtitle-field')?.innerHTML ? 1 : 0;
                meta.provider = 'Disney+';
                meta.isResolved = true;
            } else if(
                window.location.href.startsWith('https://www.youtube.com/watch?v=')
            ) {
                const title = await detect('#container > h1 > yt-formatted-string');

                isRunning = document.querySelector('.html5-video-player')?.classList.contains('playing-icon');

                observerCleanups.isRunning.current = observe('.html5-video-player', element => {
                    let hasChanged = false;

                    if(element?.classList.contains('playing-mode') && !isRunning) {
                        hasChanged = true;
                        isRunning = true;
                    } else if(element?.classList.contains('paused-mode') && isRunning) {
                        hasChanged = true;
                        isRunning = false;
                    }

                    if(hasChanged) {
                        socket.emit('player', {
                            isRunning: isRunning
                        });
                    }
                });

                isMuted = !document.querySelector('.ytp-mute-button > svg > defs');

                observerCleanups.isMuted.current = observe('.ytp-mute-button', element => {
                    let hasChanged = false;

                    if(!!element.querySelector('svg > defs') && isMuted) {
                        hasChanged = true;
                        isMuted = false;
                    } else if(!element.querySelector('svg > defs') && !isMuted) {
                        hasChanged = true;
                        isMuted = true;
                    }

                    if(hasChanged) {
                        socket.emit('player', {
                            isMuted: isMuted
                        });
                    }
                });

                await detect('#text > a');

                meta.title = title.textContent || 'Unknown';
                meta.additional = document.querySelector('#text > a').innerHTML || '';
                meta.type = 0;
                meta.provider = 'YouTube';
                meta.isResolved = true;
            } else if(
                window.location.href.startsWith('https://www.amazon.') &&
                document.title.startsWith('Amazon') &&
                document.title.endsWith('| Prime Video')
            ) {
                let r = async () => {
                    await detect('#dv-web-player.dv-player-fullscreen');

                    let title = await detect('div.title');

                    while (title.innerHTML?.length === 0) {
                        title = await detect('div.title');
                    }

                    meta.title = title.innerHTML || 'Unknown';
                    meta.additional = document.querySelector('.subtitle').innerHTML || '';
                    meta.type = document.querySelector('.subtitle')?.innerHTML ? 1 : 0;
                    meta.provider = 'Amazon Prime Video';
                    meta.isResolved = true;

                    socket.emit('resolve', {
                        href: window.location.href,
                        ...meta,
                    });

                    isRunning = document.querySelector('.pausedOverlay > .buttons > *:nth-child(2)')?.classList.contains('playIcon');

                    observerCleanups.isRunning.current = observe('.pausedOverlay > .buttons > *:nth-child(2)', element => {
                        let hasChanged = false;

                        if(element?.classList.contains('pausedIcon') && !isRunning) {
                            hasChanged = true;
                            isRunning = true;
                        } else if(element?.classList.contains('playIcon') && isRunning) {
                            hasChanged = true;
                            isRunning = false;
                        }

                        if(hasChanged) {
                            socket.emit('player', {
                                isRunning: isRunning
                            });
                        }
                    })

                    await detect('#dv-web-player.dv-player-fullscreen', {
                        isInverted: true
                    });

                    cleanup();

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

            if(meta?.isResolved) {
                socket.emit('player', {
                    isRunning: isRunning,
                    isMuted: isMuted
                });
            }
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