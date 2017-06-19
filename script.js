//--------------------------
//------ SIMON GAME --------
//--------------------------

//------ State -------------

const TURN = {
  neither: 0,
  computer: 1,
  user: 2
}

const COLORNAMES = ["red", "green", "blue", "yellow"]

function SimonGame (options){
  state = {
    questionView:true,
    challenge:0,
    turn: TURN.neither,
    strict: false,
    colorSequence:[],
    highlightedColor: null,
    mistake: false,
    levelSuccess: false,
    gameSuccess: false,
  }

  //------ Display -------------

  function htmlQuestionView(){
    function buttonHTML(data, text){
      return `<button type="button" class="btn btn-default" data=${data}>${text}</button>`
    }
    function htmlSpaces (times){
      return '&emsp;'.repeat(times)
    }

    return `<div id="questionView"><p>Choose your challenge:\n</p>
    ${buttonHTML(5, "5")}
    ${buttonHTML(10, "10")}
    ${buttonHTML(15, "15")}
    ${buttonHTML(20, "20")}
    </div>`
  }

  function render (){
    WinText=["You", " Made", "It", "!!!"]
    let colorDivs =COLORNAMES.reduce((accu, color, indx)=>{
      let extraclass = state.highlightedColor === color ? 'light' : ''
      return accu + `<div id="${color}" data-color="${color}" class="color ${extraclass}">
      ${ (state.gameSuccess) ? WinText[indx] : "" } </div>`
    }, "")

    let title = `<div id="title" class="text-center"><h1>SIMON</h1></div>`
    const steps = state.colorSequence.length
    let centerElements = `<div id="display" class="text-center"><div id="steps"><p>steps: <span> ${steps} </span></p></div><div id="challenge"><p>challenge: <span> ${state.challenge} </span></p></div></div>
    <div id="start-button"><button type="button" id="start" class="btn btn-default">GO!</button></div>
    <div id="strict-button"><button id="strict" type="button" class="btn btn-default ${state.strict? "active" : "" }"> Strict </button></div>`
    let center = `<div id=center>${title} ${(state.questionView)? htmlQuestionView() : centerElements} </div>`

    board = `<div id='board'> ${center}  ${colorDivs} </div>`

    options.el.innerHTML = `${board}`

    let soundURL = ""
    const soundURLBase = "https://raw.githubusercontent.com/carpben/simon-circle/master/"
    const SOUNDURLS = {
      celebration: soundURLBase + "celebration.wav",
      mistake: soundURLBase + "mistake.mp3",
      success: soundURLBase + "success.wav",
      COLORS: {
        red: soundURLBase + "simonSound1.wav",
        green: soundURLBase + "simonSound2.wav",
        blue: soundURLBase + "simonSound3.wav",
        yellow: soundURLBase + "simonSound4.wav",
      },
    }
    if (state.gameSuccess){soundURL = SOUNDURLS.celebration}
    else if (state.mistake){soundURL = SOUNDURLS.mistake}
    else if (state.success){soundURL = SOUNDURLS.success}
    else if (state.highlightedColor){
     soundURL = SOUNDURLS.COLORS[state.highlightedColor]
    }

    if (soundURL){
      var audio = new Audio(soundURL);
      audio.play();
    }
  }

  function deBrightenColor(){
    state.highlightedColor = null
    render()
  }

  function brightenColor(color){
    state.highlightedColor = color
    render()
  }

//------   USER   -------

function startUserTurn(){
  console.log('startUserTurn')
  //reset some state stuff
  state.turn=TURN.user
  state.mistake = false
  state.success = false
  state.step=0
}

function handleUserMistake(){
  state.turn=TURN.neither
  state.mistake = true
  render()
  state.mistake = false
  if (state.strict){
    setTimeout(
      function(){
        startNewGame()
        }
    , 2800)
  }
  else {
    setTimeout(
      function(){
        state.turn=TURN.computer
        doComputerTurn(state.colorSequence)
          .then(()=>{startUserTurn()})
        }
    , 2800)
  }
}

function handleLevelSuccess(){
  state.turn=TURN.neither
  state.success = true
  render()
  state.success = false
  setTimeout(startNextlevel, 2500 )
}

function handleGameSuccess(){
  state.gameSuccess = true
  state.turn = TURN.neither
  render()
}

function colorMouseDown(color){
  if (state.turn!=TURN.user){return}

  if (state.colorSequence[state.step]!==color) {
    handleUserMistake()
    return
  }

  state.step++
  brightenColor(color)
}

function colorMouseUp(){
  if (state.turn!=TURN.user){return}

  deBrightenColor()

  if (state.step==state.challenge){
    handleGameSuccess()
  }
  else if (state.step === state.colorSequence.length){
    handleLevelSuccess()
  }
}

//------   challenge   -------

function addColorToSequence(){
  let randomColor = COLORNAMES[Math.floor(Math.random() * COLORNAMES.length)]
  state.colorSequence.push(randomColor)
}

function showComputerColor(color){
  brightenColor(color)
  return new Promise(function(resolve,reject){
    setTimeout(function(){
      deBrightenColor()
      resolve()
    }, 800)
  })
}

function showSequence(colorSequence=[], resolve) {

  if (state.turn!=TURN.computer){
    console.log('ShowSequence, state.turn = ', state.turn)
  }
  colorSequence = colorSequence.slice(0)
  const DELAY = 175

  if(colorSequence.length === 0) {
    resolve()
    return
  }

  let color = colorSequence.shift()

  showComputerColor(color)
    .then(()=>{
      setTimeout(function(){showSequence(colorSequence, resolve)},DELAY)
    })
}

function doComputerTurn (){
  return new Promise ( (resolve,reject) => {
    showSequence(state.colorSequence, resolve)
  })
}

function startNextlevel(){
  state.turn=TURN.computer
  addColorToSequence()
  doComputerTurn(state.colorSequence).then(()=>{
    startUserTurn()
  })
}


//------   Button Handlers   -------

function setChallenge(ev){
  state.challenge = $(ev.currentTarget).attr('data')
  state.questionView = false
  render()
}

function startNewGame(){
  if (state.turn==TURN.computer){return}
  state.colorSequence=[]
  state.gameSuccess= false
  startNextlevel()
}

function toggleStrictMode(){
  if (state.turn==TURN.computer){return}
  state.strict = (!state.strict)
  render()
}

  render()

  $(options.el).on('click', '#questionView button', setChallenge)
  $(options.el).on('click', '#start', startNewGame)
  $(options.el).on('click', '#strict', toggleStrictMode )
  $(options.el).on('mousedown', `.color`, function(ev){
    colorMouseDown($(ev.currentTarget).attr('data-color'))
  })
  $(options.el).on('mouseup', `.color`, function(ev){
    colorMouseUp()
  })

}

const simonGame = new SimonGame ({
  el: document.querySelector('#root')
})
