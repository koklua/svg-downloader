listAllSVGElements();

async function listAllSVGElements() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    let response = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            return Array.from(document.body.getElementsByTagName('svg')).map(x => x.outerHTML);
        },
    });

    let list = document.getElementById('svgList');
    for (const item of response[0].result) {
        let li = document.createElement('li');
        li.innerHTML = item;
        let button = document.createElement('button')
        button.innerHTML = "Download"
        li.appendChild(button)
        list.append(li);
        button.addEventListener("click", handleButtonClick);
    };
}

function handleButtonClick(event) {
    
    let svgElements = Array.from(event.target.parentElement.getElementsByTagName('svg'))
    
    if (svgElements.length > 0) {
        let svgElement = svgElements[0]
        console.log(svgElement)
        // TODO: download image
    } else {
        // TODO: Error message
    }
}

