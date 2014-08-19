"use strict";
/* jshint multistr: true */
/* jshint newcap: false */

/**
 * AutoUpdate : Prévient l'utilisateur quand une nouvelle version du script est disponible.
 */
SK.moduleConstructors.AutoUpdate = SK.Module.new();

SK.moduleConstructors.AutoUpdate.prototype.id = "AutoUpdate";
SK.moduleConstructors.AutoUpdate.prototype.title = "Alerte quand une mise à jour est disponible";
SK.moduleConstructors.AutoUpdate.prototype.description = "Affiche une alerte en haut à droite de l'écran quand une mise à jour de SpawnKill est disponible";
SK.moduleConstructors.AutoUpdate.prototype.required = false;

/** Délais entre deux notifications en secondes */
SK.moduleConstructors.AutoUpdate.NOTIFICATION_INTERVAL = 3600;

/**
 * Initialise le module, fonction appelée quand le module est chargé
 */
SK.moduleConstructors.AutoUpdate.prototype.init = function() {

	//On décale légérement la récupération pour ne pas retarder le chargement de la page
	setTimeout(function() {

		this.getLastRelease(function(release) {

			//Si la version courante n'est pas la dernière et que la notification 
			//n'a pas déjà été vue au cours de la dernière heure, on affiche une notification
			if(release.tag_name !== SK.VERSION) {

				var updateSeen = SK.Util.getValue("update.seen");

				//Si c'est une version mineure, il faut que l'option soit activée
				if(this.releaseType(release) === "major" || this.getSetting("enableBugFixAlert")) {

					//Si aucune notification n'a été vue ou que le délai est dépassé
					if(!updateSeen || (SK.Util.timestamp() - updateSeen) > SK.moduleConstructors.AutoUpdate.NOTIFICATION_INTERVAL) {
						this.showUpdateModal(release);

						//On regarde régulièrement si la notif n'a pas été fermée dans un autre onglet
						this.intervalDismissIfSeen();
					}
				}
			}
		}.bind(this));

	}.bind(this), 1500);
};

/**
 * Retourne "minor" ou "major" en fonction du type de la release.
 */
SK.moduleConstructors.AutoUpdate.prototype.releaseType = function(release) {
	return typeof release.tag_name.split(".")[3] !== "undefined" ? "minor" : "major";
};

/*
 * Récupérer la dernière release de SpawnKill sur Github
 * Et appelle la fonction de callback avec cette release.
 */
SK.moduleConstructors.AutoUpdate.prototype.getLastRelease = function(callback) {

 	callback = callback || function() {};
	//On appelle l'API Github
	GM_xmlhttpRequest({
		url: "http://dl.spixel.fr/greasemonkey/jvc-spawnkill/server/api-github.php?action=releases",
		method: "GET",
		onload: function(response) {
			callback(JSON.parse(response.responseText)[0]);
			// callback({
			// 	"name": "Ne ratez plus les mises à jour !",
			// 	"tag_name": "v1.14",
			// });
		}
	});
};

/**
 * Affiche la fenêtre modale de mise à jour.
 */
SK.moduleConstructors.AutoUpdate.prototype.showUpdateModal = function(release) {

	var self = this;

	var modalTitle = "Une mise à jour de SpawnKill est disponible";
	if (this.releaseType(release) === "minor") {
		modalTitle = "Un correctif pour SpawnKill est disponible";
	}

	var modalContent = "\
		<h4>" + release.name + "<span class='spawnkill-version' >" + release.tag_name + "</span></h4>\
	";

	var pseudoRandomString = new Array(16 + 1).join((Math.random().toString(36) + "00000000000000000").slice(2, 18)).slice(0, 10);

	var $downloadButton = new SK.Button({
	    class: "large",
	    text: "Installer",
	    href: "https://github.com/dorian-marchal/spawnkill/raw/" + release.tag_name + "/jvc-spawnkill.user.js?nocache&" + pseudoRandomString + ".user.js",
	    target: "_blank",
	    tooltip: {
	        class: "large bottom-right",
	        text: "Installer la mise à jour",
	        position: "bottom"
	    }
	});

	var $changelogButton = new SK.Button({
	    class: "large minor",
	    text: "Changelog",
	    href: "https://github.com/dorian-marchal/spawnkill/releases/latest",
	    target: "_blank",
	    tooltip: {
	        class: "large bottom-right",
	        text: "Voir les nouveautés de cette version",
	        position: "bottom"
	    }
	});

	var $modal = new SK.Modal({
		class: "update",
	    location: "notification",
	    title: modalTitle,
	    content: modalContent,
	    buttons: [ $changelogButton, $downloadButton ],
	    closeButtonAction: function() {
	    	self.dissmisUpdateNotification();
	    }
	});

	SK.Util.showModal($modal);
};

/** Regarde réguilèrement si la notif n'a pas été fermée dans un autre onglet */
SK.moduleConstructors.AutoUpdate.prototype.intervalDismissIfSeen = function() {

	setInterval(function() {

		var updateSeen = SK.Util.getValue("update.seen");

		//Si aucune notification n'a été vue ou que le délai est dépassé
		if(updateSeen && (SK.Util.timestamp() - updateSeen) <= SK.moduleConstructors.AutoUpdate.NOTIFICATION_INTERVAL) {
			SK.Util.hideModal();
		}

	}.bind(this), 2000);
};

/** Supprime la modale et enregistre que l'utilisateur a vu la notification dans le localStorage */
SK.moduleConstructors.AutoUpdate.prototype.dissmisUpdateNotification = function() {
	SK.Util.setValue("update.seen", SK.Util.timestamp());
	SK.Util.hideModal();
};

/**
 * Retourne le CSS à injecter si le plugin est activé.
 * Par défaut, aucun CSS n'est injecté.
 */
SK.moduleConstructors.AutoUpdate.prototype.getCss = function() {

	var css = "\
		.modal-box.update h4 {\
			font-size: 1.2em;\
			font-weight: normal;\
			margin: 10px 0px 20px;\
		}\
		.modal-box.update .spawnkill-version {\
			color: #A3A3A3;\
			float: right;\
		}\
	";
    return css;
};

/* Options modifiables du plugin */ 
SK.moduleConstructors.AutoUpdate.prototype.settings = {
    enableBugFixAlert: {
        title: "Notification pour les corrections de bug",
        description: "Quand cette option est activée, une notification apparait si une correction de bug est en ligne.",
        default: false,
    }
};