		<script src="js/vr/HelioWebXRPolyfill.js"></script>

		<script type="module">

			import * as THREE from 'three.module.js';
			import { OrbitControls } from 'OrbitControls.js';
			import { TubePainter } from 'TubePainter.js';
			import { VRButton } from 'VRButton.js';

			var container;
			var camera, scene, renderer;
			var controller1, controller2;

			var cursor = new THREE.Vector3();

			var controls;

			init();
			animate();

			function init() {

				container = document.createElement( 'div' );
				document.body.appendChild( container );

				scene = new THREE.Scene();
				scene.background = new THREE.Color( 0x222222 );

				camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.01, 50 );
				camera.position.set( 0, 1.6, 3 );

				controls = new OrbitControls( camera, container );
				controls.target.set( 0, 1.6, 0 );
				controls.update();

				var geometry = new THREE.BoxBufferGeometry( 0.5, 0.8, 0.5 );
				var material = new THREE.MeshStandardMaterial( {
					color: 0x444444,
					roughness: 1.0,
					metalness: 0.0
				} );
				var table = new THREE.Mesh( geometry, material );
				table.position.y = 0.35;
				table.position.z = 0.85;
				scene.add( table );

				var geometry = new THREE.PlaneBufferGeometry( 4, 4 );
				var material = new THREE.MeshStandardMaterial( {
					color: 0x222222,
					roughness: 1.0,
					metalness: 0.0
				} );
				var floor = new THREE.Mesh( geometry, material );
				floor.rotation.x = - Math.PI / 2;
				scene.add( floor );

				var grid = new THREE.GridHelper( 10, 20, 0x111111, 0x111111 );
				// grid.material.depthTest = false; // avoid z-fighting
				scene.add( grid );

				scene.add( new THREE.HemisphereLight( 0x888877, 0x777788 ) );

				var light = new THREE.DirectionalLight( 0xffffff, 0.5 );
				light.position.set( 0, 4, 0 );
				scene.add( light );

				//

				var painter1 = new TubePainter();
				scene.add( painter1.mesh );

				var painter2 = new TubePainter();
				scene.add( painter2.mesh );

				//

				renderer = new THREE.WebGLRenderer( { antialias: true } );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				renderer.outputEncoding = THREE.sRGBEncoding;
				renderer.xr.enabled = true;
				container.appendChild( renderer.domElement );

				document.body.appendChild( VRButton.createButton( renderer ) );

				// controllers

				function onSelectStart() {

					this.userData.isSelecting = true;

				}

				function onSelectEnd() {

					this.userData.isSelecting = false;

				}

				function onSequeezeStart() {

					this.userData.isSqueezing = true;
					this.userData.positionAtSqueezeStart = this.position.y;
					this.userData.scaleAtSqueezeStart = this.scale.x;

				}

				function onSqueezeEnd() {

					this.userData.isSqueezing = false;

				}

				controller1 = renderer.xr.getController( 0 );
				controller1.addEventListener( 'selectstart', onSelectStart );
				controller1.addEventListener( 'selectend', onSelectEnd );
				controller1.addEventListener( 'squeezestart', onSequeezeStart );
				controller1.addEventListener( 'squeezeend', onSqueezeEnd );
				controller1.userData.painter = painter1;
				scene.add( controller1 );

				controller2 = renderer.xr.getController( 1 );
				controller2.addEventListener( 'selectstart', onSelectStart );
				controller2.addEventListener( 'selectend', onSelectEnd );
				controller2.addEventListener( 'squeezestart', onSequeezeStart );
				controller2.addEventListener( 'squeezeend', onSqueezeEnd );
				controller2.userData.painter = painter2;
				scene.add( controller2 );

				//

				var geometry = new THREE.CylinderBufferGeometry( 0.01, 0.02, 0.08, 5 );
				geometry.rotateX( - Math.PI / 2 );
				var material = new THREE.MeshStandardMaterial( { flatShading: true } );
				var mesh = new THREE.Mesh( geometry, material );

				var pivot = new THREE.Mesh( new THREE.IcosahedronBufferGeometry( 0.01, 2 ) );
				pivot.name = 'pivot';
				pivot.position.z = - 0.05;
				mesh.add( pivot );

				controller1.add( mesh.clone() );
				controller2.add( mesh.clone() );

				//

				window.addEventListener( 'resize', onWindowResize, false );

			}

			function onWindowResize() {

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );

			}

			//

			function handleController( controller ) {

				var userData = controller.userData;
				var painter = userData.painter;

				var pivot = controller.getObjectByName( 'pivot' );

				if ( userData.isSqueezing === true ) {

					var delta = ( controller.position.y - userData.positionAtSqueezeStart ) * 5;
					var scale = Math.max( 0.1, userData.scaleAtSqueezeStart + delta );

					pivot.scale.setScalar( scale );
					painter.setSize( scale );

				}

				cursor.setFromMatrixPosition( pivot.matrixWorld );

				if ( userData.isSelecting === true ) {

					painter.lineTo( cursor );
					painter.update();

				} else {

					painter.moveTo( cursor );

				}

			}

			function animate() {

				renderer.setAnimationLoop( render );

			}

			function render() {

				handleController( controller1 );
				handleController( controller2 );

				renderer.render( scene, camera );

			}

		</script>