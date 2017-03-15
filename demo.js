'use strict';
// animation durations
const BOUNCING_DURATION = 2000;
const SWIPING_OUT_DURATION = 500;
const THROTTLE_THRESHOLD = 100;
const BASE_URL = 'http://message-list.appspot.com';

// utility functions
function isScrolledIntoView(el) {
  let elemTop = el.getBoundingClientRect().top+50,
    elemBottom = el.getBoundingClientRect().bottom-50;
  return (elemTop > 0) && (elemBottom-40 < window.innerHeight);
}

function isScrolledOutOfView(el) {
  let elemTop = el.getBoundingClientRect().top,
    elemBottom = el.getBoundingClientRect().bottom;
  return (elemBottom <= 0) || ( elemTop >= window.innerHeight);
}

// data models
let messages = [];
function removeMessageById(id) {
  messages = messages.filter(m => {
    return m.id !== id;
  });
}

class FetchService {
  static fetchMessages(limit) {
    return $.ajax(BASE_URL + '/messages?limit='+limit+'&pageToken=' + FetchService.pageToken)
      .done(function(resObj) {
        FetchService.pageToken = resObj.pageToken;
        messages = messages.concat(resObj.messages);
      });
  }
}

// ui components
class MessageCard {
  constructor() {
    this.avatarContainer = document.createElement("img");
    this.avatarContainer.className = "message-avatar";

    this.nameContainer = document.createElement("div");
    this.nameContainer.className = "message-name";

    this.updatedContainer = document.createElement("div");
    this.updatedContainer.className = "message-updated";

    this.authorContainer = document.createElement("div");
    this.authorContainer.className = "message-header";
    this.authorContainer.appendChild(this.avatarContainer);
    this.authorContainer.appendChild(this.nameContainer);
    this.authorContainer.appendChild(this.updatedContainer);
    
    this.contentContainer = document.createElement("div");
    this.contentContainer.className = "message-content";
    
    this.rootElement = document.createElement("div");
    this.rootElement.appendChild(this.authorContainer);
    this.rootElement.appendChild(this.contentContainer);
    
    this.render = this.render.bind(this);
    this.rootElement.addEventListener('render', this.render);
  }
  
  render(ev) {
    let message = messages[ev.detail];
    
    if (ev.detail > -1) {
      this.rootElement.id = "msg-card-" + message.id;
      this.rootElement.classList = ["message-card"];
      this.rootElement.style.transform = '';
      
      this.nameContainer.innerHTML = message.author.name;
      this.avatarContainer.src = BASE_URL + message.author.photoUrl;
      this.updatedContainer.innerHTML = moment(message.updated).fromNow();
      this.contentContainer.innerHTML = message.content;
    } else {
      this.rootElement.id = '';
      this.rootElement.className = "message-empty";
      this.rootElement.style.transform = '';
      
      this.nameContainer.innerHTML = '';
      this.avatarContainer.src = '';
      this.updatedContainer.innerHTML = '';
      this.contentContainer.innerHTML = '';
    }
  }
}

class InfinitelyMessagesList {
  constructor(root, limit) {
    this.limit = limit || 20;
    this.root = root;
    this.renderPerTime = 4;
    this.firstVisibleMessageIndex = 0;
    this.lastVisibleMessageIndex = 0;
    this.lastScrollTop = 0;
    
    this.paddingTopContainer = document.createElement("div");
    this.paddingTopContainer.className = 'padding-container';
    this.cardsContainer = document.createElement("div");
    this.cardsContainer.className = 'message-cards-container';
    this.root.appendChild(this.paddingTopContainer);
    this.root.appendChild(this.cardsContainer);
  
    // create a fixed number of message boxes and insert into root container
    for (let i = 0; i < this.limit; i++) {
      this.cardsContainer.appendChild(new MessageCard().rootElement);
    }
  
    this.scrollHdl = this.scrollHdl.bind(this);
    this.swipeHdl = this.swipeHdl.bind(this);
    
    // use hammer.js helping hanlde swipe events
    this.hammer = new Hammer(this.cardsContainer);
    this.hammer.on('swiperight swipeleft', this.swipeHdl);
    
    this.delayedScrollHandler = _.throttle(this.scrollHdl, THROTTLE_THRESHOLD, {'trailing': false});
    window.addEventListener("scroll", this.delayedScrollHandler);

    this.getNextMessages(this.limit);
  }
  
  getNextMessages(limit) {
    limit = limit || this.limit;
    let _this = this;
    
    window.removeEventListener("scroll", _this.delayedScrollHandler);
    FetchService.fetchMessages(limit)
      .done(function() {
        window.addEventListener("scroll", _this.delayedScrollHandler);
        _this.renderTopDown();
      });
  }
  
  renderTopDown() {
    if (!this.lastVisibleBox) {
      window.scrollTo(0, 0);
      this.lastVisibleBox = this.cardsContainer.firstElementChild;
      this.lastVisibleBox.dispatchEvent(new CustomEvent('render', { 'detail': this.lastVisibleMessageIndex }));
    }
    
    while (isScrolledIntoView(this.lastVisibleBox) && this.lastVisibleMessageIndex < messages.length-1) {
      for (let i = 0; i < this.renderPerTime && this.lastVisibleMessageIndex < messages.length-1; i++) {
        if (this.lastVisibleBox.nextElementSibling) {
          this.lastVisibleBox = this.lastVisibleBox.nextElementSibling;
          this.lastVisibleBox.dispatchEvent(new CustomEvent('render', {'detail': ++this.lastVisibleMessageIndex}));
        }
      }
      
      // recycle non-visible cards from top
      while (isScrolledOutOfView(this.cardsContainer.firstElementChild)) {
        let first = this.cardsContainer.firstElementChild,
          firstHeight = first.offsetHeight;
        if (first.id.length) {
          this.firstVisibleMessageIndex++;
        }
  
        this.cardsContainer.removeChild(first);
        first.dispatchEvent(new CustomEvent('render', {'detail': -1}));
        this.cardsContainer.appendChild(first);
        
        let paddingTop = this.paddingTopContainer.offsetHeight;
        paddingTop += firstHeight;
        this.paddingTopContainer.style.height = paddingTop + 'px';
      }
      this.firstVisibleBox = this.cardsContainer.firstElementChild;
    }
    
    if (this.lastVisibleMessageIndex >= messages.length - this.renderPerTime) {
      this.getNextMessages();
    }
  }
  
  renderBottomUp() {
    if (!this.firstVisibleBox) {
      this.firstVisibleBox = this.cardsContainer.firstElementChild;
      this.firstVisibleBox.dispatchEvent(new CustomEvent('render', { 'detail': this.firstVisibleMessageIndex }));
    }
  
    while (isScrolledIntoView(this.firstVisibleBox) && this.firstVisibleMessageIndex > 0) {
      for (let i = 0; i < this.renderPerTime && this.firstVisibleMessageIndex > 0; i++) {
        if (this.firstVisibleBox.previousElementSibling) {
          this.firstVisibleBox = this.firstVisibleBox.previousElementSibling;
          this.firstVisibleBox.dispatchEvent(new CustomEvent('render', {'detail': --this.firstVisibleMessageIndex}));
  
          let firstHeight = this.firstVisibleBox.offsetHeight;
          let paddingTop = this.paddingTopContainer.offsetHeight;
          paddingTop = paddingTop - firstHeight > 100 ? paddingTop - firstHeight : 100;
          this.paddingTopContainer.style.height = paddingTop + 'px';
        }
      }
      
      // recycle non-visible cards from bottom
      while (isScrolledOutOfView(this.cardsContainer.lastElementChild)) {
        let last = this.cardsContainer.lastElementChild;
        if (last.id.length) {
          this.lastVisibleMessageIndex--;
        }
        
        this.cardsContainer.removeChild(last);
        last.dispatchEvent(new CustomEvent('render', { 'detail': -1 }));
        this.cardsContainer.insertBefore(last, this.cardsContainer.firstElementChild);
      }
      this.lastVisibleBox = this.cardsContainer.lastElementChild;
    }
  }
  
  removeCard(card) {
    let _this = this;
    let messageId = parseInt(card.id.slice(9));
    removeMessageById(messageId);
    this.lastVisibleMessageIndex--;
  
    let nextSibling = card.nextElementSibling;
    nextSibling.addEventListener('webkitAnimationEnd', function() {
      nextSibling.classList.remove('bounce');
      
      // add swipe event hdl after bouncing effect animation is done.
      _this.hammer.on('swiperight swipeleft', _this.swipeHdl);
    });
    nextSibling.classList.add('bounce');
  
    // remove selected message box after swiping animation effect is done.
    setTimeout(function() {
      _this.cardsContainer.removeChild(card);
      card.dispatchEvent(new CustomEvent('render', { 'detail': -1 }));
      _this.cardsContainer.appendChild(card);
      _this.renderTopDown();
    }, SWIPING_OUT_DURATION);
  }
  
  scrollHdl() {
    let st = window.scrollY;
    
    if (st < this.lastScrollTop) {
      this.renderBottomUp();
    } else {
      this.renderTopDown();
    }
    this.lastScrollTop = st;
  }
  
  swipeHdl(event) {
    this.hammer.off('swiperight swipeleft', this.swipeHdl);
    
    let card = event.target;
    while (card.parentElement !== this.cardsContainer) {
      card = card.parentElement;
    }
  
    card.classList.add('swiping-out');
    if (event.deltaX > 0) {       // swipe to right
      card.style.transform = 'translateX(' + window.innerWidth + 'px)';
    } else {                      // swipe to left
      card.style.transform = 'translateX(' + (-1 * window.innerWidth) + 'px)';
    }
    this.removeCard(card);
  }
}

document.addEventListener("DOMContentLoaded", function() {
  new InfinitelyMessagesList(document.querySelector('.app-container'));
});