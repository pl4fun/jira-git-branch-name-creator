// ==UserScript==
// @name         JIRA branch name generator
// @namespace    http://tampermonkey.net/
// @version      0.1
// @author       https://github.com/pl4fun
// @match        https://*.atlassian.net/*
// @grant        GM_addStyle
// ==/UserScript==

function GM_addStyle(css) {
    const style =
        document.getElementById("GM_addStyleBy8626") ||
        (function () {
            const style = document.createElement("style");
            style.type = "text/css";
            style.id = "GM_addStyleBy8626";
            document.head.appendChild(style);
            return style;
        })();
    const sheet = style.sheet;
    sheet.insertRule(css, (sheet.rules || sheet.cssRules || []).length);
}

GM_addStyle(`
.copy-branch-btn-wrapper {
    display: flex;
    position: relative;
}
`);

GM_addStyle(`
.create-branch-btn {
    padding: 0 1em;
    margin: 0 1em;
    cursor: pointer;
    -webkit-box-align: baseline;
    align-items: baseline;
    box-sizing: border-box;
    display: inline-flex;
    font-size: inherit;
    font-style: normal;
    font-weight: normal;
    max-width: 100%;
    text-align: center;
    white-space: nowrap;
    height: auto;
    line-height: inherit;
    vertical-align: baseline;
    width: auto;
    color: rgb(80, 95, 121) !important;
    border-width: 0px;
    text-decoration: none;
    background: rgba(9, 30, 66, 0.04);
    border-radius: 3px;
    transition: background 0.1s ease-out 0s, box-shadow 0.15s cubic-bezier(0.47, 0.03, 0.49, 1.38) 0s;
    outline: none !important;
    position: relavent;
}`);

GM_addStyle(`
.create-branch-btn:hover {
    color: rgb(23, 43, 77) !important;
    background: rgb(223, 225, 230) !important;
}
`);

GM_addStyle(`
.create-branch-btn:active, .create-branch-btn:focus {
    color: rgb(0, 82, 204) !important;
    background: rgba(179, 212, 255, 0.6);
}
`);

let currentURL = window.location.href;
let oldURL = "";
let interval;

function addBranchButton() {
    "use strict";

    const breadcrumbsContainers = document.querySelectorAll('div[data-test-id*="breadcrumbs"]');
    const lastBreadcrumbsContainer = breadcrumbsContainers[breadcrumbsContainers.length - 1];
    const createBranchButton = document.getElementById("create-branch-name");

    const copy = (value) => {
        if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(value);
        }
        return Promise.reject('The Clipboard API is not available.');
    }

    const createBranchName = () => {
        const jiraTitle = document.querySelectorAll('h1[data-test-id*="issue.views.issue-base.foundation.summary.heading"]')[0].innerText;
        const jiraId = lastBreadcrumbsContainer.innerText;

        const kebabCase = (string) => string
            .replace(/([a-z])([A-Z])/g, "$1-$2")
            .replace(/[",'.-]+/g, '')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();

        copy(`${jiraId}-${kebabCase(jiraTitle)}`);
    }

    const showCopiedText = () => {
        createBranchName();

        const buttonCopyWrapper = document.querySelector(".copy-branch-btn-wrapper");

        let copiedTextNotation = document.createElement("span");
        copiedTextNotation.id = "copied-txt";
        copiedTextNotation.style.position = "absolute";
        copiedTextNotation.style.top = "1px";
        copiedTextNotation.style.left = "120%";
        copiedTextNotation.style.color = "green";
        copiedTextNotation.innerHTML = `Copied`;

        buttonCopyWrapper.append(copiedTextNotation);

        setTimeout(() => copiedTextNotation.remove(), 3000);
    }

    let copiedButton = document.createElement("div");
    copiedButton.classList.add("copy-branch-btn-wrapper", "branch-name-ge");
    copiedButton.innerHTML = `<input type="button" class="create-branch-btn" value="Copy branch name" id="create-branch-name">`;

    if (lastBreadcrumbsContainer && !createBranchButton) {
        lastBreadcrumbsContainer.append(copiedButton);
    }

    if (!!createBranchButton) {
        clearInterval(interval);
        createBranchButton.addEventListener('click', showCopiedText);
    } else {
        clearInterval(interval);
        interval = setInterval(addBranchButton, 300);
    }
}

function checkURLChange(currentURL) {
    if (currentURL !== oldURL) {
        addBranchButton();
        oldURL = currentURL;
    } else {
        const isBranchNameButtonExist = !!document.querySelector(".branch-name-ge");

        if (!isBranchNameButtonExist) {
            addBranchButton();
        }
    }

    oldURL = window.location.href;
    setTimeout(function () {
        checkURLChange(window.location.href);
    }, 1000);
}

addBranchButton();
checkURLChange(currentURL);
