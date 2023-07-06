const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
};

const Symbols = [
  "https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png", // 黑桃
  "https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png", // 愛心
  "https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png", // 方塊
  "https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png", // 梅花
];

const view = {
  getCardContent(index) {
    //卡片正面
    // 0-12 : 黑桃(1-13)、 13-25 : 愛心(1-13)、26-38 : 方塊(1-13) 、 39-51 : 梅花(1-13)
    const number = this.transFormNumber((index % 13) + 1);
    const Symbol = Symbols[Math.floor(index / 13)];

    return `
        <p>${number}</p>
        <img src="${Symbol}"/>
        <p>${number}</p>`;
  },

  getCardElement(index) {
    //卡片背面
    return `<div data-index="${index}" class="card back"></div>`;
    //透過data set的設置，可以將index資料綁在牌背
  },

  transFormNumber(number) {
    switch (number) {
      case 1:
        return `A`;

      case 11:
        return `J`;

      case 12:
        return `Q`;

      case 13:
        return `K`;

      default:
        return number;
    }
  },

  displayCards(indexes) {
    //參數 indexes => 把已經打散過的陣列傳進後，將其顯示
    const rootElement = document.querySelector(`#cards`);
    rootElement.innerHTML = indexes
      .map((index) => this.getCardElement(index))
      //利用map作為迭代陣列，將洗好的牌依序丟進getCardElement()方法中
      .join("");
    //最後使用join()方法變成字串，才能回傳至HTML(因為上方的結果還是陣列)
  },

  //接收各個參數，將參數變成各個陣列
  //cards = [1,2,3,4,5]
  flipCards(...cards) {
    cards.map((card) => {
      //如果是背面，則回傳正面
      if (card.classList.contains("back")) {
        card.classList.remove("back");
        card.innerHTML = this.getCardContent(Number(card.dataset.index));
        return;
      }
      //如果是正面，則回傳背面
      card.classList.add("back");
      card.innerHTML = null;
    });
  },

  pairCards(...cards) {
    cards.map((card) => {
      //配對成功的樣式變化
      card.classList.add("paired");
    });
  },

  renderScore(score) {
    //text content = inner content
    //innerHTML
    document.querySelector(".score").textContent = `Score : ${score}`;
  },

  renderTriedTimes(tried) {
    document.querySelector(
      ".tried"
    ).textContent = `You've tried : ${tried} times`;
  },

  appendWrongAnimation(...cards) {
    cards.map((card) => {
      card.classList.add("wrong");
      card.addEventListener(
        "animationend",
        (
          event //動畫播完一秒後消失
        ) => card.classList.remove("wrong"),
        { once: true }
      ); //once: true代表在事件執行一次之後，就卸載監聽器
    });
  },
  showGameFinished() {
    const div = document.createElement("div");
    div.classList.add("completed");
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `;
    const header = document.querySelector("#header");
    header.before(div);
  },
};

const utility = {
  //此程式是洗牌，而洗牌方式為最後一張牌與上方隨機一張牌交換，以此類推
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys());
    //將回傳的52張牌，生成連續數字陣列
    for (let index = number.length - 1; index > 0; index--) {
      let ramdomIndex = Math.floor(Math.random() * (index + 1));
      [number[index], number[ramdomIndex]] = [
        number[ramdomIndex],
        number[index],
      ];
    }
    //for迴圈是進行洗牌的動作
    return number; //最後回傳陣列結果
  },
};

const controller = {
  //利用contronller去呼叫model或view
  //起始狀態是第一次翻牌前(還未翻牌)
  currentState: GAME_STATE.FirstCardAwaits,
  //利用currentState標記目前狀態

  generateCards() {
    //遊戲開始
    //call view
    view.displayCards(utility.getRandomNumberArray(52));
  },

  //依照不同的遊戲狀態，做不同的行為
  dispatchCardAction(card) {
    if (!card.classList.contains("back")) {
      return;
    }

    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        //當遊戲狀態為第一次翻牌前(還未翻牌)
        view.flipCards(card); //透過view進行翻牌的動作
        model.revealedCards.push(card); //將已翻的牌放進model的資料裡
        this.currentState = GAME_STATE.SecondCardAwaits; //最後將目前狀態改為第二次翻牌前(已翻第一次)
        break;

      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes); //再翻第二次前，嘗試次數 +1
        //當遊戲狀態為第二次翻牌前(已翻第一次)
        view.flipCards(card); //透過view進行翻牌的動作
        model.revealedCards.push(card); //將已翻的牌放進model的資料裡

        if (model.isRevealedCardsMatched()) {
          //配對正確
          view.renderScore((model.score += 10)); //如果兩排確認正確，分數 +10
          this.currentState = GAME_STATE.CardsMatched; //將配對成功之卡片目前狀態改為CardsMatched
          view.pairCards(...model.revealedCards); //並將配對完成的卡片呼叫view(將卡片底色改變)
          //需要將內容清空
          model.revealedCards = [];
          if (model.score === 260) {
            console.log("showGameFinished");
            this.currentState = GAME_STATE.GameFinished;
            view.showGameFinished(); // 加在這裡
            return;
          }
          this.currentState = GAME_STATE.FirstCardAwaits; //最後將卡片目前狀態改為FirstCardAwaits
        } else {
          //配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed;
          view.appendWrongAnimation(...model.revealedCards); //將配對成功之卡片目前狀態改為CardsMatchFailed
          //需要有時間讓使用者記住牌面，利用setTimeout
          setTimeout(this.resetCards, 1000); //setTimeout回傳的第一個參數是function本身
        }
        break;
    }

    // console.log("current state:", this.currentState);
    // console.log("revealed cards:", model.revealedCards);
  },

  resetCards() {
    view.flipCards(...model.revealedCards);
    model.revealedCards = [];
    controller.currentState = GAME_STATE.FirstCardAwaits;
  },
};

const model = {
  //資料的管理
  //需要的資料是 : 目前翻開的牌有哪些
  revealedCards: [],

  isRevealedCardsMatched() {
    //比對在revealedCards中的牌是否數字相同
    return (
      this.revealedCards[0].dataset.index % 13 ===
      this.revealedCards[1].dataset.index % 13
    );
  },

  score: 0, //在model中增加計算成績的資料

  triedTimes: 0, //在model中增加嘗試的數量
};

controller.generateCards();

// 呈現nodelist(array-like)
document.querySelectorAll(".card").forEach((card) => {
  // 每張小卡片
  card.addEventListener("click", (event) => {
    // view.appendWrongAnimation(card);
    controller.dispatchCardAction(card);
  });
});
