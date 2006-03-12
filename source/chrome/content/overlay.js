/* ***** BEGIN LICENSE BLOCK *****

    Copyright (c) 2004  Jason Adams <imagezoom@yellowgorilla.net>

    This file is part of Image Zoom.

    Image Zoom is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    Image Zoom is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Image Zoom; if not, write to the Free Software
    Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

 * ***** END LICENSE BLOCK ***** */

// Image Zoom Version
var version = "0.2";

// Preference Service objects
var nsIPrefServiceObj = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
var nsIPrefBranchObj = nsIPrefServiceObj.getBranch("imagezoom.");

var linuxImage;
var izContext;
var contextDisabled = false;

var gPanelContainer = window;
var mousedown = false;

// Initialise image zoom when the window has finished loading
window.addEventListener("load", initImageZoom, false);

function initImageZoom() {

	// Check the version to display initilisation page if appropriate
	var oldVersion = nsIPrefBranchObj.getCharPref("version");

	if (oldVersion < version) {
		nsIPrefBranchObj.setCharPref("version", version);
		try {
			// try to save the prefs because we don't want to reset the home page if prefs can't be saved
			nsIPrefServiceObj.savePrefFile(null);
			if (nsIPrefBranchObj.getCharPref("version") == version)
				window.openDialog("chrome://imagezoom/content/install.xul", "", "chrome,centerscreen", oldVersion);

		} catch(e) {
			//alert(e);
		}
	}

	// For Mozilla and Firefox
    if (document.getElementById("contentAreaContextMenu")){
        document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", imageZoomMenu, false);
    }
    // For Thunderbird
    else if (document.getElementById("messagePaneContext")){
        document.getElementById("messagePaneContext").addEventListener("popupshowing", imageZoomMenu, false);
    }

    // Add events for the mouse functions
	gPanelContainer.addEventListener("mousedown",onMouseDown,true);

	//document.getElementById("content").addEventListener("DOMNodeInserted", zoomAllImages, false);

	// Add Image Zooming to text reduce command
	var cmdZoomReduce = document.getElementById("cmd_textZoomReduce");
	var prevCmd = cmdZoomReduce.getAttribute("oncommand");
	cmdZoomReduce.setAttribute("oncommand", prevCmd + " ZoomImageManager.prototype.getInstance().pageLoad();");

	// Add Image Zooming to text enlarge command
	var cmdZoomEnlarge = document.getElementById("cmd_textZoomEnlarge");
	prevCmd = cmdZoomEnlarge.getAttribute("oncommand");
	cmdZoomEnlarge.setAttribute("oncommand", prevCmd + " ZoomImageManager.prototype.getInstance().pageLoad();");

	// Add Image Zooming to text reset command
	var cmdZoomReset = document.getElementById("cmd_textZoomReset");
	prevCmd = cmdZoomReset.getAttribute("oncommand");
	cmdZoomReset.setAttribute("oncommand", prevCmd + " ZoomImageManager.prototype.getInstance().pageLoad();");
	
	window.addEventListener("load",registerImageZoomListener(),false);
	window.addEventListener("unload",unregisterImageZoomListener(),false);
	


}

function reportStatus(oizImage){
	//write the zoom factor to the status bar
	window.top.status = "Image Zoom " + oizImage.zoomFactor() + "%";
}

function izShowCustomZoom()
{
	// Create the image object and pass it to the custom zoom dialog
	var oizImage = new izImage(document.popupNode);
	openDialog("chrome://imagezoom/content/customzoom.xul", "", "chrome,modal,centerscreen", "Image", oizImage);
	reportStatus(oizImage);
}

function izShowCustomZoomPage()
{
	// Create the image object and pass it to the custom zoom dialog
	var zoomManager = ZoomImageManager.prototype.getInstance();
	openDialog("chrome://imagezoom/content/customzoom.xul", "", "chrome,modal,centerscreen", "Page", zoomManager);
}

function izShowCustomDim()
{
	// Create the image object and pass it to the custom dimension dialog
	var oizImage = new izImage(document.popupNode);
	openDialog("chrome://imagezoom/content/customdim.xul", "", "chrome,modal,centerscreen", oizImage);
	reportStatus(oizImage);
}

function izImageFit(){
	// Create the object and invoke its Fit to window method passing the autocenter option
	var oizImage = new izImage(document.popupNode);
	oizImage.fit(nsIPrefBranchObj.getBoolPref("autocenter"));
	reportStatus(oizImage);
}

function izZoomIn()
{
	//Create the object and invoke its zoom method passing the factor to zoom
	var oizImage = new izImage(document.popupNode);
	oizImage.zoom(nsIPrefBranchObj.getIntPref("zoomvalue")/100);
	reportStatus(oizImage);
}

function izZoomOut()
{
	//Create the object and invoke its zoom method passing the factor to zoom
	var oizImage = new izImage(document.popupNode);
	oizImage.zoom(100/nsIPrefBranchObj.getIntPref("zoomvalue"));
	reportStatus(oizImage);
}

function izSetZoom(zFactor)
{
	//Create the object and invoke its setZoom method passing the factor to zoom
	var oizImage = new izImage(document.popupNode);
	oizImage.setZoom(zFactor);
	reportStatus(oizImage);
}

function disableContextMenu(e) {
	if (document.popupNode.tagName == "IMG") {
		linuxImage = new izImage(document.popupNode);
		izContext = e.originalTarget;
		e.preventDefault();
		contextDisabled = true;
	}
	removeEventListener("popupshowing", disableContextMenu, true)
}

function onMouseDown(e){
	// prepare for the mouse functions on a right click when user option is true
	if ((e.which == nsIPrefBranchObj.getIntPref("triggerbutton")) && (nsIPrefBranchObj.getBoolPref("usescroll"))){
		if (navigator.platform != "Win32" && navigator.platform != "OS/2") {
			addEventListener("popupshowing", disableContextMenu, true);
		}

		haveZoomed = false;
		gPanelContainer.addEventListener("DOMMouseScroll",ScrollImage,true);
		gPanelContainer.addEventListener("mouseup",onMouseUp,true);
		gPanelContainer.addEventListener("click",onClick,true);
		mousedown = true;
	}
}

function onMouseUp(e){
	// Right mouse button release, remove listeners
	if (e.which == nsIPrefBranchObj.getIntPref("triggerbutton")){
		if (haveZoomed){
			e.preventDefault();
			e.stopPropagation();
		}
		if (linuxImage)
			linuxImage = null;

		gPanelContainer.removeEventListener("DOMMouseScroll",ScrollImage,true);
		gPanelContainer.removeEventListener("mouseup",onMouseUp,true);
		mousedown = false;
	}
}

function onClick(e){
	if (e.which == nsIPrefBranchObj.getIntPref("triggerbutton")){
		if (haveZoomed){
			e.preventDefault();
			e.stopPropagation();
		} else {
            // contextmenu on mousedown
     		if (contextDisabled) {
				document.popupNode = e.originalTarget;
				izContext.showPopup(izContext.ownerDocument.documentElement, e.clientX, e.clientY, "context", "bottomleft", "topleft");
			}
  		}
		gPanelContainer.removeEventListener("click",onClick,true);
	}

	if (mousedown){
		// Invoke varios mouse function when mouse is over an image only
		if (e.originalTarget.tagName == "IMG") {
			switch(e.which){
			// Middle mouse button pressed while right button down, reset image
			case nsIPrefBranchObj.getIntPref("imageresetbutton"):
				e.preventDefault();
				e.stopPropagation();
				haveZoomed = true;
				var oizImage = new izImage(e.originalTarget);
				oizImage.setZoom(100);
				reportStatus(oizImage);
				break;
			// Left mouse button pressed while right button down, fit image to screen
			case nsIPrefBranchObj.getIntPref("imagefitbutton"):
				e.preventDefault();
				e.stopPropagation();
				haveZoomed = true;
				var oizImage = new izImage(e.originalTarget);
				oizImage.fit(nsIPrefBranchObj.getBoolPref("autocenter"));
				reportStatus(oizImage);
				break;
			}
		} else {
			gPanelContainer.removeEventListener("click",onClick,true);
		}
	}
}

function ScrollImage(e){
	// Scroll wheel invoked while right button down, zoom target image
	if (((e.target.tagName == "IMG") || (linuxImage != null)) && (nsIPrefBranchObj.getBoolPref("usescroll"))){
		e.preventDefault();
		e.stopPropagation();
		haveZoomed = true;
		if (linuxImage != null)
			var oizImage = linuxImage
		else
			var oizImage = new izImage(e.target);


		if (((e.detail < 0) && !nsIPrefBranchObj.getBoolPref("reversescrollzoom")) ||
			((e.detail > 0) && nsIPrefBranchObj.getBoolPref("reversescrollzoom")))
			var zoomFactor = 1/(1+(nsIPrefBranchObj.getIntPref("scrollvalue")/100));
		else
			var zoomFactor = 1+(nsIPrefBranchObj.getIntPref("scrollvalue")/100);

		oizImage.zoom(zoomFactor);
		reportStatus(oizImage);
	}
}

function insertSeparator(list, position){
	var beforeShow = false;
	var afterShow = false;

	// Check for visable items before the separator
	for (var i=position-1;i>=0;i--){
		if ((list[i].tagName == "menuseparator") && (!list[i].hidden))
			break;
		if ((list[i].tagName != "menuseparator") && (!list[i].hidden)){
			beforeShow = true;
			break;
		}
	}

	// Check for visable items after the separator
	if (beforeShow) {
		for (var i=position+1;i<list.length;i++){
			if ((list[i].tagName != "menuseparator") && (!list[i].hidden)){
				afterShow = true;
				break;
			}
		}
	}

	// If there are visable items before and after the separator then return true
	return (beforeShow && afterShow);
}

function imageZoomMenu(e) {

	var MenuItems = new Array("context-zoom-zin","context-zoom-zout","context-zoom-zreset","context-zoom-zcustom","context-zoom-dcustom","context-zoom-fit","zoomsub-zin","zoomsub-zout","zoomsub-zreset","zoomsub-zcustom","zoomsub-dcustom","zoomsub-fit","zoomsub-z400","zoomsub-z200","zoomsub-z150","zoomsub-z125","zoomsub-z100","zoomsub-z75","zoomsub-z50","zoomsub-z25","zoomsub-z10");
	var OptionItems = new Array("mmZoomIO","mmZoomIO","mmReset","mmCustomZoom","mmCustomDim","mmFitWindow","smZoomIO","smZoomIO","smReset","smCustomZoom","smCustomDim","smFitWindow","smZoomPcts","smZoomPcts","smZoomPcts","smZoomPcts","smZoomPcts","smZoomPcts","smZoomPcts","smZoomPcts","smZoomPcts");

	// Display the correct menu items depending on options and whether an image was clicked
	for (var i=0;i<MenuItems.length;i++)
		document.getElementById(MenuItems[i]).setAttribute("hidden", (!gContextMenu.onImage || !nsIPrefBranchObj.getBoolPref(OptionItems[i])));

	var subPopUp = document.getElementById("zoompopup");

	// Insert the necesary separators if needed in the sub menu
	var subItems =  document.getElementById("zoompopup").getElementsByTagName("*");
	for (var i=0; i<subItems.length; i++) {
		if (subItems[i].tagName == "menuseparator")
			subItems[i].setAttribute("hidden", !insertSeparator(subItems, i));
	}

	// Show the Zoom Image container if there are subitems visible, else hide
	if (subPopUp.getElementsByAttribute("hidden", false).length > 0)
		document.getElementById("context-zoomsub").hidden = false;
	else
		document.getElementById("context-zoomsub").hidden = true;
}

function getXULBrowser(DOMWindow) {
	// First a quick try for most common occurence
	if (gBrowser.selectedBrowser.contentWindow == DOMWindow)
		return gBrowser.selectedBrowser;

	// Now for the thorough search as we didn't find it above
	for (var i=0; i<gBrowser.browsers.length; i++) {
		if (gBrowser.browsers.item(i).contentWindow == DOMWindow)
			return gBrowser.browsers.item(i);
	}
}

function MessageLoad(e){
	ZoomImageManager.prototype.getInstance(window.document.getElementById("messagepane")).pageLoad();
}

function registerImageZoomListener(){
	if (window.document.getElementById("messagepane")) {
		var messageContent = window.document.getElementById("messagepane");
		if (messageContent)
   			messageContent.addEventListener("load", MessageLoad, true);
	} else {

		window.getBrowser().addProgressListener(imageZoomListener , Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);

	}
}

function unregisterImageZoomListener(){
	if (window.document.getElementById("messagepane")) {
		var messageContent = window.document.getElementById("messagepane");
		if (messageContent)
   			messageContent.removeEventListener("load", test, true);
	} else {
		window.getBrowser().removeProgressListener(imageZoomListener);
	}
}

var imageZoomListener =
{
	QueryInterface: function(aIID)
	{
		if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
			aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
			aIID.equals(Components.interfaces.nsISupports))
				return this;
		throw Components.results.NS_NOINTERFACE;
	},

	onStateChange: function(aProgress, aRequest, aFlag, aStatus)
	{
		ZoomImageManager.prototype.getInstance().pageLoad();
		return 0;
	},

	onLocationChange: function(aProgress, aRequest, aURI)
	{
		// This fires when the location bar changes i.e load event is confirmed
		// or when the user switches tabs
		ZoomImageManager.prototype.getInstance().pageLoad();
		return 0;
	},

	onProgressChange : function (aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress)
	{
		if (ZoomImageManager.prototype.getInstance().imageZoom != 100)
			ZoomImageManager.prototype.getInstance().pageLoad();
		return 0;
	},

	// For definitions of the remaining functions see XulPlanet.com
	onStatusChange: function() {return 0;},
	onSecurityChange: function() {return 0;},
	onLinkIconAvailable: function() {return 0;}
}