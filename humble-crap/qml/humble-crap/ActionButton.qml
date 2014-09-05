import QtQuick 2.0
import QtGraphicalEffects 1.0

Item {
	id: container
	property string text: "ACTION"
	property string databaseIdent: ""
	property string url: ""
	property color colour: "#FFFFFF"
	property color background: "#00acc1"
	property int fontSize: 10

	signal clicked

	antialiasing: true

	width: 64
	height: 20

	function go() {
		console.log("download", url)
	}

	Rectangle {
		id: rectangle1

		radius: 0
		border.width: 0
		border.color: "#000000"
		anchors.fill: parent
		color: container.background
		Text {
			id: text1
			color: container.colour
			text: container.text
			anchors.fill: parent
			verticalAlignment: Text.AlignVCenter
			horizontalAlignment: Text.AlignHCenter
			font.pointSize: 8
			font.bold: true
		}

		MouseArea {
			id: mousearea1
			x: 0
			y: 0
			anchors.rightMargin: 0
			anchors.bottomMargin: 0
			anchors.leftMargin: 0
			anchors.topMargin: 0
			hoverEnabled: true
			anchors.fill: parent
			onPressed: container.state = "clicked"
			onReleased: container.state = ""
			onClicked: container.clicked()
			onEntered: container.state = "hover"
			onExited:  container.state = ""
		}
	}
	DropShadow {
		anchors.fill: rectangle1
		horizontalOffset: 3
		verticalOffset: 3
		radius: 8.0
		samples: 16
		color: "#80000000"
		source: rectangle1
	}



	states: [
		State {
			name: "clicked"

			PropertyChanges {
				target: rectangle1
				anchors.rightMargin: -1
				anchors.bottomMargin: -1
				anchors.leftMargin: 1
				anchors.topMargin: 1
			}
		},
		State {
			name: "hover"

			PropertyChanges {
				target: rectangle1
				color: "#05343a"
	  }
  }
	]
}
