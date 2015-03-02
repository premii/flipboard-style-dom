
(function (window) {

    var helper = window.helper || (window.helper = {});

    var prefixedTransform = helper.getPrefixedProperty('transform');

    helper.closest = function (el, fn) {
        while (el) {
            if (fn(el)) {
                return el;
            }
            el = el.parentNode;
        }
    };

    helper.pointerEventToXY = function(e){
        var out = {x:0, y:0};

        if (e.type.indexOf('touch') === 0) {
            var touch = e.touches[0] || e.changedTouches[0];
            out.x = touch.pageX;
            out.y = touch.pageY;
        }
        else if (e.type.indexOf('mouse') === 0) {
            out.x = e.pageX;
            out.y = e.pageY;
        }
        return out;
    };

    helper.easeOutQuad = function (t) {
        return t*(2-t);
    };

    var animatePanels = function(topPanelOptions, bottomPanelOptions, availableDistance, availableDuration, direction, callback) {

        var topPanel = topPanelOptions.page,
            bottomPanel = bottomPanelOptions.page,
            topPanelEndPosition = topPanelOptions.endPosition,
            topPanelStartPosition = topPanelOptions.startPosition;

        var startTime = Date.now(),
            duration = availableDuration / availableDistance * Math.abs(topPanelStartPosition - topPanelEndPosition),
            currentY = topPanelStartPosition,
            frameCount = 0;


        direction = direction || 1;
    //    console.warn('animatePages(): duration', duration);

        callback = callback || function () {};

        var getBottomPanelYPosition = function(x, direction) {
            return (x - (availableDistance * direction)) / 2;
        };

        topPanel.style.display = 'block';
        bottomPanel.style.display = 'block';

        var animate = function () {
            //    console.log('animate()');
            var currentTime = Date.now(),
                time = Math.min(1, ((currentTime - startTime) / duration)),
                easedT = helper.easeOutQuad(time);

            frameCount++;

            currentY = (easedT * (topPanelEndPosition - (topPanelStartPosition))) + topPanelStartPosition;

            topPanel.style[prefixedTransform] = 'translate3d(0, ' + (currentY) + 'px, 0)';

            bottomPanel.style[prefixedTransform] = 'translate3d(0, ' + getBottomPanelYPosition(currentY, direction) + 'px, 0)';

            if (time < 1 && ((direction === -1 && currentY < topPanelEndPosition) || (direction === 1 && currentY > topPanelEndPosition))) {
                window.requestAnimationFrame(animate);
            }
            else {
                callback({
                    frameCount: frameCount,
                    time: +new Date - startTime
                });
            }
        };

        window.requestAnimationFrame(animate);
    };

    var hideAllChildren = function(visibleItems) {
        var item,
            visibleChildIndex;

        visibleItems[0].classList.add('swipe-current');

        for(var i = 0, len = visibleItems.length; i < len; i++) {
            item = visibleItems[i];

            if (item.classList.contains('swipe-current')) {
                visibleChildIndex = i;
                if (i > 0) {
                    visibleItems[i - 1].style.display = 'block'; //previous item visible
                }
                item.style.display = 'block'; //make current item visible
            }
            else {
                item.style.display = 'none'; //all other hidden
            }

            if (i == visibleChildIndex + 1) {
                item.style.display = 'block'; //make next item is visible
                item.style[prefixedTransform] = 'translate3d(0, 100%, 0)';
            }
            else if (i == visibleChildIndex - 1) {
                item.style.display = 'block'; //make previous item is visible
                item.style[prefixedTransform] = 'translate3d(0, -100%, 0)';
            }
        }
    };

    var calculateTopPanelYPosition = function(visibleWindowHeight, bottomYPosition, direction) {
        direction = direction || 1;

        var topYPosition = (visibleWindowHeight * direction) + (bottomYPosition * 2);
        if (direction === 1) {
            if (topYPosition < 0) {
                topYPosition = 0;
            }
        }
        else if (direction === -1) {
            if (topYPosition > 0) {
                topYPosition = 0;
            }
        }

        return topYPosition;
    };

    var enablePanelSwipe = function (option) {

        var scrollableOptions = {};
        scrollableOptions.scrollRegion = option.scrollRegion;
        scrollableOptions.children = option.children;
        scrollableOptions.afterAnimationCallback = option.callback || function() {};

        var swipeDirty = false,
            startXY,
            continueAnimation = 0,
            allowedTimePerPixel = 65/100,
            allowedTime = 350; // maximum allowed time to travel available distance (visiblePanelHeight)

        var isAnimating = false,
            swipeVerticalPossible = false,
            currentPanel,
            nextPanel,
            prevPanel,
            swipeToPanel,
            visiblePanelHeight,
            touchStartTime;

        var lastXY,
            panelPositions;

        var onTouchStart = function(event) {

            var target = event.target;

            if (!isAnimating && scrollableOptions.scrollRegion.contains(target)) {

                currentPanel = helper.closest(target, function (el) {
                    return el.classList.contains('swipe-current');
                });

                if (currentPanel) {
                    swipeVerticalPossible = true;

                    touchStartTime = +new Date();
                    startXY = helper.pointerEventToXY(event);
                    visiblePanelHeight = currentPanel.clientHeight;
                    nextPanel = currentPanel.nextElementSibling;
                    prevPanel = currentPanel.previousElementSibling;
                }
            }
        };

        var cleanUpOnTouchEnd = function() {

            if (swipeDirty === 1) {
                if (prevPanel) {
                    prevPanel.style.display = 'none';
                }
                nextPanel = swipeToPanel.nextElementSibling;

                if (nextPanel) {
                    nextPanel.style[prefixedTransform] = 'translate3d(0, 100%, 0)';
                    nextPanel.style.display = 'block';
                }
            }
            else if (swipeDirty === -1)  {

                if (nextPanel) {
                    nextPanel.style.display = 'none';
                }
                prevPanel = swipeToPanel.previousElementSibling;

                if (prevPanel) {
                    prevPanel.style[prefixedTransform] = 'translate3d(0, -100%, 0)';
                    prevPanel.style.display = 'block';
                }
            }

            if (swipeVerticalPossible && isAnimating) {
                scrollableOptions.afterAnimationCallback(swipeToPanel);
            }

            swipeVerticalPossible = false;

            isAnimating = false;
            nextPanel = null;
            prevPanel = null;
            currentPanel = null;

            swipeDirty = false;
            lastXY = null;

        };

        var onTouchEnd = function(event) {
            
            if (swipeVerticalPossible && swipeDirty && !isAnimating) {

                swipeDirty = swipeDirty === 1 ? 1 : -1;

                allowedTime = visiblePanelHeight * allowedTimePerPixel;

                isAnimating = true;
                animatePanels({
                        page: swipeToPanel,
                        startPosition: panelPositions.top,
                        endPosition: 0
                    },
                    {
                        page: currentPanel,
                        startPosition: panelPositions.bottom
                    },
                    visiblePanelHeight,
                    allowedTime,
                    swipeDirty,
                    function(op) {

                        var bottomYPosition = (swipeDirty === 1) ? '-100%' : '100%';
                        currentPanel.style[prefixedTransform] = 'translate3d(0, ' + bottomYPosition + ', 0)';

                        currentPanel.classList.remove('swipe-current');
                        swipeToPanel.classList.add('swipe-current');

                        window.setTimeout(function() {
                            swipeToPanel.querySelector('.fleft').innerHTML = op.frameCount + ' frames ' + ' / ' + op.time + 'ms';
                        }, 100);
                        cleanUpOnTouchEnd();
                    });

            }
            else if (!isAnimating) {
                cleanUpOnTouchEnd();
            }

        };


        var onTouchMove = function(event) {

            event.preventDefault();

            if (isAnimating || !swipeVerticalPossible) {
                return;
            }

            lastXY = helper.pointerEventToXY(event);

            var swipeDiff = lastXY.y - startXY.y;

            if (Math.abs(swipeDiff) > 0) {

                if (swipeDiff > 0 && prevPanel) {
                    swipeToPanel = prevPanel;
                    swipeDirty = -1;
                }
                else if (swipeDiff < 0 && nextPanel) {
                    swipeToPanel = nextPanel;
                    swipeDirty = 1;
                }
                else {
                    swipeToPanel = null;
                    swipeDirty = 0;
                }

                if (swipeToPanel) {

                    panelPositions = {
                        bottom: swipeDiff,
                        top: calculateTopPanelYPosition(visiblePanelHeight, swipeDiff, swipeDirty)
                    };

                    currentPanel.style[prefixedTransform] = 'translate3d(0, ' + panelPositions.bottom + 'px, 0)';
                    currentPanel.style.zIndex = 1;

                    swipeToPanel.style[prefixedTransform] = 'translate3d(0, ' + panelPositions.top + 'px, 0)';
                    swipeToPanel.style.zIndex = 2;
                }
            }
        };

    //    console.log(scrollableOptions.children);
        hideAllChildren(scrollableOptions.children);

        //Adding event everytime init gets called. May be add a check so only one event is added.

        scrollableOptions.scrollRegion.addEventListener('touchstart', onTouchStart, false);
        scrollableOptions.scrollRegion.addEventListener('touchmove', onTouchMove, false);
        scrollableOptions.scrollRegion.addEventListener('touchend', onTouchEnd, false);
    };

    helper.enablePanelSwipe = enablePanelSwipe ;

}(window));
