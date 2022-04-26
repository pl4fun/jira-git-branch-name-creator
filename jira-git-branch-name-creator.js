// ==UserScript==
// @name         JIRA branch name generator
// @namespace    http://tampermonkey.net/
// @version      0.5
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
    position: relative !important;
    transition: background 0.1s ease-out;
}`);

GM_addStyle(`
.create-branch-btn {
    padding: 8px 12px;
    margin: 0 1em;
    cursor: pointer;
    -webkit-box-align: baseline;
    align-items: baseline;
    box-sizing: border-box;
    display: inline-flex;
    font-size: inherit;
    font-style: normal;
    font-weight: 500;
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
    box-shadow: 0 0 1px 1px rgba(9,30,66,0.13);
}`);

GM_addStyle(`
.create-branch-btn:hover {
    color: rgb(23, 43, 77) !important;
    background: rgb(223, 225, 230) !important;
}`);

GM_addStyle(`
.create-branch-btn:active, .create-branch-btn:focus {
    color: rgb(0, 82, 204) !important;
    background: rgba(179, 212, 255, 0.6);
}`);

GM_addStyle(`
.drop-list-possible-name-prefixes {
    position: absolute;
    right: 14px;
    border-radius: 3px;
    background: rgb(255, 255, 255);
    z-index: 100;
    box-shadow: rgb(9 30 66 / 8%) 0px 0px 0px 1px, rgb(9 30 66 / 8%) 0px 2px 1px, rgb(9 30 66 / 31%) 0px 0px 20px -6px;
    display: none;
    flex-direction: column;
    width: 142px;
    margin-top: 44px;
    box-sizing: border-box;
}`);

GM_addStyle(`
.drop-list-possible-name-prefixes:before {
    content: "";
    width: 100%;
    height: 12px;
    position: absolute;
    top: -10px;
}`);

GM_addStyle(`
.copy-branch-btn-wrapper:hover .drop-list-possible-name-prefixes, .drop-list-possible-name-prefixes:hover {
    display: flex;
}`);

GM_addStyle(`
.drop-list-prefix-item {
    padding: 8px 12px;
    border-radius: 3px;
    font-weight: 600;
    color: #42526E;
    cursor: pointer;
    margin: 0;
    -webkit-box-align: baseline;
    align-items: baseline;
    box-sizing: border-box;
    display: inline-flex;
    font-size: inherit;
    font-style: normal;
    text-align: left;
    white-space: nowrap;
    vertical-align: baseline;
    border-width: 0px;
    text-decoration: none;
    background: #ffffff;
    transition: background 0.1s ease-out;
    outline: none !important;
}`);

GM_addStyle(`
.drop-list-prefix-item:hover {
    background: #0052cc;
    color: #ffffff;
}`);

GM_addStyle(`
[data-test-id="issue.views.issue-base.foundation.breadcrumbs.breadcrumb-parent-issue-container"], [data-test-id="issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue-container"] {
    align-items: center;
}`);

GM_addStyle(`
.drop-list-optional {
    all: unset;
    padding: 4px 0;
    text-align: center;
    font-size: 12px;
    color: #ff6c4a;
}`);

let currentURL = window.location.href;
let oldURL = "";
let interval;

function addBranchButton() {
    "use strict";

    const breadcrumbsContainers = document.querySelectorAll('div[data-test-id*="breadcrumbs"]');
    const lastBreadcrumbsContainer = breadcrumbsContainers[breadcrumbsContainers.length - 1];
    const createBranchButton = document.getElementById("create-branch-name");
    const featureCreateBranchButton = document.getElementById("feature-prefix-item");
    const bugCreateBranchButton = document.getElementById("bug-prefix-item");
    const hotfixCreateBranchButton = document.getElementById("hotfix-prefix-item");
    const releaseCreateBranchButton = document.getElementById("release-prefix-item");

    const copy = (value) => {
        if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(value);
        }
        return Promise.reject('The Clipboard API is not available.');
    }

    const createBranchName = (prefix) => {
        const jiraTitle = document.querySelectorAll('h1[data-test-id*="issue.views.issue-base.foundation.summary.heading"]')[0].innerText;
        const jiraId = lastBreadcrumbsContainer.innerText;

        const kebabCase = (string) => string
            .replace(/([a-z])([A-Z])/g, "$1-$2")
            .replace(/[",:/\[\]'.-/(/)]+/g, '')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();

        if (typeof prefix === 'string') {
            copy(`${prefix}/${jiraId}-${kebabCase(jiraTitle)}`)
        } else {
            copy(`${jiraId}-${kebabCase(jiraTitle)}`)
        }
    }

    const showCopiedText = (prefix) => {
        createBranchName(prefix);

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
    copiedButton.innerHTML = `<input type="button" class="create-branch-btn" value="Copy branch name" id="create-branch-name">
                              <div class="drop-list-possible-name-prefixes" id="drop-list-possible-name-prefixes">
                                  <input type="button" class="drop-list-optional" value="Select prefix(optional)">
                                  <input type="button" class="drop-list-prefix-item" id="feature-prefix-item" value="Feature">
                                  <input type="button" class="drop-list-prefix-item" id="bug-prefix-item" value="Bug">
                                  <input type="button" class="drop-list-prefix-item" id="hotfix-prefix-item" value="Hotfix">
                                  <input type="button" class="drop-list-prefix-item" id="release-prefix-item" value="Release">
                              </div>`;

    if (lastBreadcrumbsContainer && !createBranchButton) {
        lastBreadcrumbsContainer.append(copiedButton);
    }

    if (!!createBranchButton) {
        clearInterval(interval);

        createBranchButton.addEventListener('click', showCopiedText);
        featureCreateBranchButton.addEventListener('click', () => showCopiedText('feature'));
        bugCreateBranchButton.addEventListener('click', () => showCopiedText('bug'));
        hotfixCreateBranchButton.addEventListener('click', () => showCopiedText('hotfix'));
        releaseCreateBranchButton.addEventListener('click', () => showCopiedText('release'));
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
