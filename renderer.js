const websiteName = 'Website Builder'

if (localStorage.getItem('goTo')) {
  goTo(localStorage.getItem('goTo'))
}

//clear temp folder on load
preload.clearTemp()

//set editViewHistoryIndex on load
localStorage.setItem('editViewHistoryIndex', 0)

document
  .querySelector('.sidebar .create')
  .addEventListener('click', selectSidebarItem)

document
  .querySelector('.sidebar .collection')
  .addEventListener('click', selectSidebarItem)

document
  .querySelector('.sidebar .servers')
  .addEventListener('click', selectSidebarItem)

document
  .querySelector('.sidebar .edit')
  .addEventListener('click', selectSidebarItem)

function selectSidebarItem() {
  localStorage.removeItem('goTo')
  document.querySelectorAll('.sidebar .selected').forEach((el) => {
    el.classList.remove('selected')
  })
  this.classList.add('selected')
  document
    .querySelectorAll('.content > div')
    .forEach((el) => el.classList.add('hidden'))
  if (this.classList.contains('create')) {
    document.querySelector('.content .createPage').classList.remove('hidden')
    loadCreatePage()
  } else if (this.classList.contains('collection')) {
    document
      .querySelector('.content .collectionPage')
      .classList.remove('hidden')
    loadCollectionPage()
  } else if (this.classList.contains('servers')) {
    document.querySelector('.content .serversPage').classList.remove('hidden')
    loadServersPage()
  } else if (this.classList.contains('edit')) {
    document.querySelector('.content .editPage').classList.remove('hidden')
    loadEditPage()
  } else {
    location.reload()
  }
}

document
  .querySelector('.sidebar .settings')
  .addEventListener('click', function () {
    document.querySelector('.settingsPopUp').classList.toggle('hidden')
    document.querySelector('.popUpOverlay').classList.toggle('use')
  })

document.querySelector('.popUpOverlay').addEventListener('click', function (e) {
  if (e.target != this) return
  document
    .querySelectorAll('.popUpOverlay > div:not(.hidden)')
    .forEach((el) => el.classList.add('hidden'))
  this.classList.remove('use')
  this.classList.remove('blur')
})

async function loadCollectionPage() {
  localStorage.setItem('goTo', 'collection')
  preload.getRunningServers()
  // wait for preload to set localStorage
  await sleep(10)
  updateTitle('Collection')
  if (localStorage.getItem('pages') == '[]') return
  document
    .querySelectorAll('.content .collectionPage div')
    .forEach((el) => el.remove())
  JSON.parse(localStorage.getItem('pages')).forEach((page) => {
    const card = document.createElement('div')
    card.classList.add('card')
    card.id = `card-${page}`
    const title = document.createElement('div')
    title.classList.add('title')
    title.innerHTML = preload.getPageInfo(page).name
    const description = document.createElement('div')
    description.classList.add('description')
    description.innerHTML = preload.getPageInfo(page).description
    card.appendChild(title)
    card.appendChild(description)
    const editBtn = document.createElement('button')
    editBtn.classList.add('editBtn')
    editBtn.innerHTML = 'Edit'
    editBtn.addEventListener('click', () => {
      localStorage.setItem('pageToEdit', page)
      goTo('edit')
    })
    const startBtn = document.createElement('button')
    startBtn.classList.add('startBtn')
    startBtn.innerHTML = 'Start Server'
    startBtn.addEventListener('click', async () => {
      preload.startServerBat(page)
      startBtn.innerHTML = 'Starting...'
      // making sure servers page isn't loaded before the server started
      await new Promise((resolve) => {
        const interval = setInterval(async () => {
          preload.getRunningServers()
          await sleep(10)
          if (
            JSON.parse(localStorage.getItem('runningServers')).includes(page)
          ) {
            resolve()
            clearInterval(interval)
          }
        }, 1000)
      })
      goTo('servers')
    })
    const deleteBtn = document.createElement('button')
    deleteBtn.classList.add('deleteBtn')
    deleteBtn.innerHTML = 'Delete'
    if (JSON.parse(localStorage.getItem('runningServers')).includes(page)) {
      startBtn.disabled = true
      deleteBtn.disabled = true
    }
    deleteBtn.addEventListener('click', () => {
      popUpQuestion(
        `Are you sure you want to delete ${preload.getPageInfo(page).name}`,
        () => {
          preload.deletePage(page)
          goToAndReload('collection')
        }
      )
    })
    card.appendChild(editBtn)
    card.appendChild(startBtn)
    card.appendChild(deleteBtn)
    document.querySelector('.content .collectionPage').appendChild(card)
  })
}

function loadCreatePage() {
  updateTitle('Create')
  document
    .querySelector('.content .createPage button')
    .addEventListener('click', () => {
      const name = document.querySelector(
        '.content .createPage #createNameInput'
      ).value
      const description = document.querySelector(
        '.content .createPage #createDescriptionInput'
      ).value
      if (!name || !description) return
      preload.createPage(name, description)
      goToAndReload('collection')
    })
}

async function loadServersPage() {
  localStorage.setItem('goTo', 'servers')
  preload.getRunningServers()
  // wait for preload to set localStorage
  await sleep(10)
  updateTitle('Running Servers')
  const servers = JSON.parse(localStorage.getItem('runningServers'))
  if (!servers || servers.length <= 0) {
    return
  }
  document
    .querySelectorAll('.content .serversPage div')
    .forEach((el) => el.remove())
  servers.forEach((page) => {
    const card = document.createElement('div')
    card.classList.add('card')
    card.id = `card-${page}`
    const title = document.createElement('div')
    title.classList.add('title')
    title.innerHTML = preload.getPageInfo(page).name
    const description = document.createElement('div')
    description.classList.add('description')
    description.innerHTML = preload.getPageInfo(page).description
    card.appendChild(title)
    card.appendChild(description)
    const stopBtn = document.createElement('button')
    stopBtn.classList.add('stopBtn')
    stopBtn.innerHTML = 'Stop Server'
    stopBtn.addEventListener('click', async () => {
      const iframe = document.createElement('iframe')
      iframe.classList.add('hidden')
      const info = preload.getPageInfo(page)
      iframe.src = `http://localhost:${info.port}/exit?p=${info.password}`
      document.body.appendChild(iframe)
      stopBtn.innerHTML = 'Stopping...'
      // making sure collection page isn't loaded before the server stopped
      await new Promise((resolve) => {
        const interval = setInterval(async () => {
          preload.getRunningServers()
          await sleep(10)
          if (
            !JSON.parse(localStorage.getItem('runningServers')).includes(page)
          ) {
            resolve()
            clearInterval(interval)
          }
        }, 1000)
      })
      goToAndReload('collection')
    })
    card.appendChild(stopBtn)
    document.querySelector('.content .serversPage').appendChild(card)
  })
}

function updateTitle(text) {
  const titleText = `${text} - ${websiteName}`
  document.querySelector('.header .title').innerHTML = titleText
  document.title = titleText
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function goTo(sidebarChild) {
  if (!document.querySelector(`.sidebar .${sidebarChild}`)) return
  //? somehow doesn't work without sleep on page reload
  await sleep()
  document.querySelector(`.sidebar .${sidebarChild}`).click()
}

function goToAndReload(sidebarChild) {
  localStorage.setItem('goTo', sidebarChild)
  location.reload()
}

function popUpQuestion(question, cb) {
  document.querySelector('.questionPopUp > div:first-child').innerHTML =
    question
  document.querySelector('.questionPopUp').classList.toggle('hidden')
  document.querySelector('.popUpOverlay').classList.toggle('use')
  document.querySelector('.popUpOverlay').classList.toggle('blur')
  //remove all old eventListener
  const oldEl = document.querySelector('.questionPopUp .answerYes')
  const newEl = oldEl.cloneNode(true)
  oldEl.parentNode.replaceChild(newEl, oldEl)
  document
    .querySelector('.questionPopUp .answerYes')
    .addEventListener('click', cb)
}

function loadEditPage() {
  if (!localStorage.getItem('pageToEdit')) return goTo('collection')
  const page = localStorage.getItem('pageToEdit')
  localStorage.setItem('goTo', 'edit')
  updateTitle(`Editing ${preload.getPageInfo(page).name}`)
  //load viewsMenu
  const views = preload.getViews(page)
  document
    .querySelectorAll('.content .editPage .viewsMenu button')
    .forEach((el) => el.remove())
  for (let i = 0; i < views.length; i++) {
    const btn = document.createElement('button')
    btn.innerHTML = views[i].slice(0, -1 * '.html'.length)
    btn.id = `viewBtn:${views[i]}`
    btn.addEventListener('click', function () {
      localStorage.setItem('viewToEdit', views[i])
      document
        .querySelectorAll('.content .editPage .viewsMenu button')
        .forEach((el) => el.classList.remove('selected'))
      this.classList.add('selected')
      document
        .querySelectorAll('.content .editPage .toolsMenu button')
        .forEach((el) => el.classList.remove('selected'))

      const frame = document.querySelector('.editPage .viewContent .frame')
      frame.innerHTML = preload.getView(page, views[i])
      document.querySelector(
        '.content .editPage .specialToolsMenu .savePageBtn'
      ).disabled = !document.querySelector(
        '.content .editPage .viewContent .frame'
      ).innerHTML

      //save loaded view to temp
      saveEditViewToTemp(page, views[i].slice(0, -1 * '.html'.length))
    })
    document.querySelector('.content .editPage .viewsMenu').appendChild(btn)
  }
  if (localStorage.getItem('viewToEdit')) {
    document
      .getElementById(`viewBtn:${localStorage.getItem('viewToEdit')}`)
      .click()
  } else {
    document.querySelector('.content .editPage .viewsMenu button').click()
  }
  document
    .querySelector('.content .editPage .specialToolsMenu .viewSrcCodeBtn')
    .addEventListener('click', function () {
      const historyIndex = parseInt(
        localStorage.getItem('editViewHistoryIndex')
      )
      const id = `${page}-${localStorage
        .getItem('viewToEdit')
        .slice(0, -1 * '.html'.length)}`
      const filePath = `temp/${id}/${
        preload.readDir(`temp/${id}`).length - 1 - historyIndex
      }.html`
      preload.createCmdProcess(
        `editToolSourceCode-${id}`,
        `${
          JSON.parse(localStorage.getItem('settings')).editPage.viewSrcCodeProg
        } ${preload.getDirname()}/${filePath}`
      )
    })

  document
    .querySelector('.content .editPage .toolsMenu .deselectBtn')
    .addEventListener('click', function () {
      const oldEl = document.querySelector(
        '.content .editPage .viewContent .frame'
      )
      document
        .querySelectorAll('.content .editPage .viewContent .frame *')
        .forEach((el) => {
          for (let i = 0; i < el.classList.length; i++) {
            if (el.classList[i].startsWith('_edit_')) {
              el.classList.remove(el.classList[i])
            }
          }
        })
      const newEl = oldEl.cloneNode(true)
      oldEl.parentNode.replaceChild(newEl, oldEl)
      document
        .querySelectorAll('.content .editPage .toolsMenu button')
        .forEach((el) => el.classList.remove('selected'))
    })

  JSON.parse(localStorage.getItem('settings')).editPage.deselectToolsBtn
    ? document
        .querySelector('.content .editPage .toolsMenu .deselectBtn')
        .classList.remove('hidden')
    : document
        .querySelector('.content .editPage .toolsMenu .deselectBtn')
        .classList.add('hidden')

  document
    .querySelector('.content .editPage .specialToolsMenu .undoBtn')
    .addEventListener('click', function () {
      const page = localStorage.getItem('pageToEdit')
      const view = localStorage
        .getItem('viewToEdit')
        .slice(0, -1 * '.html'.length)
      const historyLength = preload.readDir(`temp/${page}-${view}`).length
      let historyIndex = parseInt(localStorage.getItem('editViewHistoryIndex'))
      document.querySelector(
        '.content .editPage .viewContent .frame'
      ).innerHTML = preload.readFile(
        `temp/${page}-${view}/${historyLength - historyIndex - 2}.html`
      )
      historyIndex++
      localStorage.setItem('editViewHistoryIndex', historyIndex)

      document.querySelector(
        '.content .editPage .specialToolsMenu .undoBtn'
      ).disabled = historyLength - historyIndex <= 1
      document.querySelector(
        '.content .editPage .specialToolsMenu .redoBtn'
      ).disabled = !(historyIndex > 0)

      document.querySelector(
        '.content .editPage .specialToolsMenu .savePageBtn'
      ).disabled = !document.querySelector(
        '.content .editPage .viewContent .frame'
      ).innerHTML
      checkSaveEdit()
      deselectEditTools()
    })

  document
    .querySelector('.content .editPage .specialToolsMenu .redoBtn')
    .addEventListener('click', function () {
      const page = localStorage.getItem('pageToEdit')
      const view = localStorage
        .getItem('viewToEdit')
        .slice(0, -1 * '.html'.length)
      const historyLength = preload.readDir(`temp/${page}-${view}`).length
      let historyIndex = parseInt(localStorage.getItem('editViewHistoryIndex'))
      document.querySelector(
        '.content .editPage .viewContent .frame'
      ).innerHTML = preload.readFile(
        `temp/${page}-${view}/${historyLength - historyIndex}.html`
      )
      historyIndex--
      localStorage.setItem('editViewHistoryIndex', historyIndex)

      document.querySelector(
        '.content .editPage .specialToolsMenu .undoBtn'
      ).disabled = historyLength - historyIndex <= 1
      document.querySelector(
        '.content .editPage .specialToolsMenu .redoBtn'
      ).disabled = !(historyIndex > 0)

      document.querySelector(
        '.content .editPage .specialToolsMenu .savePageBtn'
      ).disabled = !document.querySelector(
        '.content .editPage .viewContent .frame'
      ).innerHTML
      checkSaveEdit()
      deselectEditTools()
    })

  //TODO: save page
  document
    .querySelector('.content .editPage .specialToolsMenu .savePageBtn')
    .addEventListener('click', function () {
      const currentFrame = document.querySelector(
        '.content .editPage .viewContent .frame'
      ).innerHTML
      console.log(currentFrame)
      // goToAndReload('edit')
    })
}

function saveEditViewToTemp(page, view) {
  const id = `${page}-${view}`
  try {
    preload.readDir(`temp/${id}`)
  } catch {
    preload.makeDir(`temp/${id}`)
  }

  let historyIndex = parseInt(localStorage.getItem('editViewHistoryIndex'))
  const historyLength0 = preload.readDir(`temp/${id}`).length

  if (historyIndex > 0) {
    for (let i = 0; i < historyIndex; i++) {
      preload.removeFileOrDir(`temp/${id}/${historyLength0 - i - 1}.html`)
    }
    historyIndex = 0
    localStorage.setItem('editViewHistoryIndex', historyIndex)
  }

  const filePath = `temp/${id}/${preload.readDir(`temp/${id}`).length}.html`
  preload.writeFile(
    filePath,
    document.querySelector('.content .editPage .viewContent .frame').innerHTML
  )
  const historyLength = preload.readDir(`temp/${id}`).length

  document.querySelector(
    '.content .editPage .specialToolsMenu .undoBtn'
  ).disabled = historyLength - historyIndex <= 1
  document.querySelector(
    '.content .editPage .specialToolsMenu .redoBtn'
  ).disabled = !(historyIndex > 0)
}

function deselectEditTools() {
  document.querySelector('.content .editPage .toolsMenu .deselectBtn').click()
}

function checkSaveEdit() {
  document.querySelector(
    '.content .editPage .specialToolsMenu .savePageBtn'
  ).disabled = !/[A-Za-z0-9]/.test(
    document.querySelector('.content .editPage .viewContent .frame').innerHTML
  )
}
