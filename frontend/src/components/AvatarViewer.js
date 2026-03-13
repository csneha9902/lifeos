import React, { useState, useEffect, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"

function AvatarModel({ model }) {
  const { scene } = useGLTF(model)
  
  const normalizedScene = useMemo(() => {
    if (!scene) return null
    
    const cloned = scene.clone()
    cloned.updateMatrixWorld(true)
    
    // Robust Bounding Box: Only consider meshes with actual geometry
    // This ignores far-away helper nodes that cause "microscopic" rendering
    const box = new THREE.Box3()
    let hasMesh = false
    cloned.traverse((obj) => {
      if (obj.isMesh && obj.geometry) {
        obj.geometry.computeBoundingBox()
        const meshBox = obj.geometry.boundingBox.clone().applyMatrix4(obj.matrixWorld)
        box.union(meshBox)
        hasMesh = true
      }
    })

    if (!hasMesh) box.setFromObject(cloned) // Fallback

    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    
    // Scale everything so the character height is exactly 2 units
    const scaleFactor = 2 / (size.y || 1)
    
    console.log(`[Avatar3D] Normalized ${model}:`, { size, scaleFactor })

    const group = new THREE.Group()
    const innerWrapper = new THREE.Group()
    
    // 1. Center the model relative to its bounding box
    cloned.position.set(-center.x, -center.y, -center.z)
    
    // 2. Rotate 180 degrees to face camera (most GLBs face -Z)
    innerWrapper.rotation.y = Math.PI
    innerWrapper.add(cloned)
    
    // 3. Apply uniform scale
    group.scale.setScalar(scaleFactor)
    group.add(innerWrapper)
    
    return group
  }, [scene, model])

  if (!normalizedScene) return null

  return <primitive object={normalizedScene} />
}

function CameraRig() {
  useFrame((state) => {
    const t = state.clock.elapsedTime
    
    // UNIVERSAL BUST VIEW (Chest-to-Head)
    // 1. Target is head/chest area of 2-unit centered model
    const targetY = 0.75 
    const target = new THREE.Vector3(0, targetY, 0)
    
    // 2. Tighter radius for portrait crop (2.3 is roughly head+chest)
    const radius = 2.3
    
    const x = Math.sin(t * 0.4) * radius
    const z = Math.cos(t * 0.4) * radius
    const y = 0.8 // Slightly elevated

    state.camera.position.set(x, y, z)
    state.camera.lookAt(target)
  })
  
  return null
}

export default function AvatarViewer({ avatar }) {
  return (
    <div style={{ 
      width: "200px", 
      height: "200px", 
      borderRadius: "50%", 
      overflow: "hidden",
      background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(7,11,20,0) 70%)"
    }}>
      <Canvas 
        style={{ width: "100%", height: "100%" }} 
        camera={{ fov: 45, near: 0.1, far: 1000, position: [0, 0, 10] }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={1.8} />
        <spotLight position={[5, 5, 5]} angle={0.2} penumbra={1} intensity={2} />
        <pointLight position={[-5, 2, -5]} intensity={1} color="#3b82f6" />
        
        <AvatarModel model={avatar} />
        <CameraRig />
      </Canvas>
    </div>
  )
}
