# The Infinitely Scrolling Demo

## Page layout
```html
  <header>
    <div class="nav-menu"><span class="fa fa-bars" aria-hidden="true"></span></div>
    <div class="heading-container">Messages</div>
  </header>
  
  <div class="app-container">
    <div class="padding-container"></div>
    <div class="message-cards-container">
      <div class=""empty-card"></div>
      <div class=""empty-card"></div>
      <div id="msg-card-1" class="message-card"></div>
      <div id="msg-card-2" class="message-card"></div>
      <div id="msg-card-3" class="message-card"></div>
      <div id="msg-card-4" class="message-card"></div>
      <div id="msg-card-5" class="message-card"></div>
      <div class=""empty-card"></div>
      <div class=""empty-card"></div>
      <div class=""empty-card"></div>
    </div>
  </div>
```
## UI components
- MessageCard
- InfinitelyMessagesList

## Scroll event handling
- window scrolling attributes
![alt text](https://raw.githubusercontent.com/graceguo/infinitely-scrolling/master/images/scrollTop_illustration.png)
- use throttle to control the rate of calling event handler.
- use a fixed number of DOM elements to render all the message items inside viewport.
- when scrolling down, render message card one by one, until DOM element is out of viewport. If no empty-card available, recycle DOM elements from top that are scrolled out of view port.
- when scrolling top, recycle unused DOM elements from bottom.
- when recycling DOM elements from top, filling additional padding space to maintain the same scroll bar position.
- Pros and Cons
  - performance
  - fast forward scrollbar


## Touch swipe event handling
- swipe message card (left or right) will remove a message from data list.
- the DOM element for the message card will be removed from view port, but appended to the end of DOM list.
- Pros and Cons
  - fast swipe or slow swipe

## Data binding



## Transition and Animation
- show transition when data is populated into message card.
```css
transition:all 1s ease-out;
```
- show position transform and grey-out for swipe effect.
```css
  opacity: 0.5;
  background-color: lightgrey;
  transition:transform 1s ease-in-out;
```
- show bouncing animation when sibling message card take space.
```css
.bounce {
  animation: bounce 2s;
}
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
  40% {transform: translateY(-30px);}
  60% {transform: translateY(-15px);}
}
```

## Issues and improvements
- newer messages data. latest message cards should show from top.
- tag or pins for seen messages


## Appendix: JS libraries used

- jQuery for ajax requests
- hammer for mobile events
- lodash
- moment


### The demo application is running at 
http://infinitely-scrolling.herokuapp.com/demo.html

### For best results, please play with mobile browsers.
