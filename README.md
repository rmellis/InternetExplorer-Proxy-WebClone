# 🌐 Internet Explorer 11 WebApp

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

A fully-functional in-browser clone of **Internet Explorer 11**, featuring a meticulously recreated **Windows 7 Aero Glass** UI. 

It has aero style frosted glass textures, the classic sunken back orb, and simple tab management. Best of all, it's fully functional: it includes built-in CORS proxies for live web surfing, a classic favorites bar, and a ugly old style dark mode.

---

## 📸 Screenshots

### The Classic Aero Interface
<img width="1202" height="609" alt="image" src="https://github.com/user-attachments/assets/af2668fa-3fcd-4a83-baff-582ccd2c4bba" />

### The New Tab Page
<img width="1202" height="609" alt="image" src="https://github.com/user-attachments/assets/ae2b5818-8a5a-4fbf-89b7-9b20583fb456" />

### Dark Mode
<img width="1202" height="609" alt="image" src="https://github.com/user-attachments/assets/cb28d9c7-674d-476b-a5db-cc32ab60f097" />

---

## ✨ Features

### 🎨 Authentic Windows 7 Aero UI
* **Frosted Glass Textures:** Uses complex CSS `linear-gradient` layering and `backdrop-filter: blur()` to  create the Windows 7 aero desktop bleed-through effect.
* **The Blue Orb:** The IE back button has been recreated, sitting perfectly flush (`-15px` margin) against the tab bar.
* **Classic Iconography:** Features the traditional Favorites star, Tools gear, and clean white iconography with sharp dark outlines.

### 🌍 Live Web Browsing (CORS Bypass)
* **Built-in Proxies:** Navigating modern the web inside an `iframe` is tricky due to modern security headers. This project utilizes a rotating fallback of public proxies (`allorigins.win`, `corsproxy.io`, `codetabs.com`) to fetch, inject base tags, and render live websites seamlessly.
* **Loading States:** Features a URL bar spinner and status bar text updates during network requests.

### 📑 Native Tab System
* Create, switch, and close multiple browsing sessions simultaneously.
* Automatically fetches and renders the correct `favicon` for the active website.
* Maintains a separate history stack (Back/Forward) for *each individual tab*.

### 🌙 Extras
* **Favorites Bar:** A classic toggleable bookmarks bar.
* **Dark Mode:** A built-in theme toggler inside the Tools menu. 
* **Custom Fallback Screens:** Classic "This page can't be displayed" error screens for timed-out proxy requests.

---

## 🚀 How to Use

Because this project is built entirely with vanilla front-end technologies, there are no build steps, package managers, or local servers required!
download and do whatever.
