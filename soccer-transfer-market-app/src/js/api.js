async function sendRequest(api, body, method, headers) {
    showSpinner()
    let _method = method || 'GET'
    let _headers = headers || {'Content-Type': 'application/json'}

    let options = {
        method: _method,
        headers: _headers,
    }

    if (body != null) {
        options.body = JSON.stringify(body)
    }

    let response

    try {
        let result = await fetch (api, options)
        response = await result.json()
    } catch (error) {
        response = {
            error: error
        }
    }

    hideSpinner()
    return response
}

function showSpinner() {
    const overlay = document.getElementById("overlay");
    const spinner = document.getElementById("spinner");

    overlay.style.display = "block";
    spinner.style.display = "block";
}

function hideSpinner() {
    const overlay = document.getElementById("overlay");
    const spinner = document.getElementById("spinner");

    overlay.style.display = "none";
    spinner.style.display = "none";
}