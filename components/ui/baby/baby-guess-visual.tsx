// "use client";
// import { Tables } from "@/database.types";
// import * as THREE from "three";
// import { Canvas, useThree } from "@react-three/fiber";
// import { OrbitControls, Text, Billboard } from "@/components/ui/drei";
// import { useControls } from "leva";
// import { useEffect, useMemo, useCallback } from "react";
// import { getBetComponentPrice } from "@/lib/helpers/pricing";

// function CameraController({
//   position,
//   fov,
// }: {
//   position: [number, number, number];
//   fov: number;
// }) {
//   const { camera } = useThree();
//   useEffect(() => {
//     if (camera instanceof THREE.PerspectiveCamera) {
//       camera.position.fromArray(position);
//       camera.fov = fov;
//       camera.updateProjectionMatrix();
//     }
//   }, [position, fov, camera]);

//   return null;
// }

// function Surface({
//   points,
//   widthSegments,
//   dateSegments,
// }: {
//   points: THREE.Vector3[];
//   widthSegments: number;
//   dateSegments: number;
// }) {
//   const geometry = useMemo(() => {
//     const geom = new THREE.BufferGeometry();
//     geom.setFromPoints(points);

//     const indices = [];
//     const width = widthSegments + 1;

//     for (let i = 0; i < dateSegments; i++) {
//       for (let j = 0; j < widthSegments; j++) {
//         const a = i * width + j;
//         const b = i * width + (j + 1);
//         const c = (i + 1) * width + j;
//         const d = (i + 1) * width + (j + 1);

//         indices.push(a, b, d); // First triangle
//         indices.push(d, c, a); // Second triangle
//       }
//     }
//     geom.setIndex(indices);
//     geom.computeVertexNormals();

//     const colors = [];
//     const color = new THREE.Color();
//     const prices = points.map((p) => p.y);
//     const minPrice = Math.min(...prices);
//     const maxPrice = Math.max(...prices);

//     for (const point of points) {
//       const normalizedPrice = (point.y - minPrice) / (maxPrice - minPrice);
//       color.setHSL(0.6, 1.0, normalizedPrice * 0.5 + 0.3); // Monochromatic blue gradient
//       colors.push(color.r, color.g, color.b);
//     }
//     geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

//     return geom;
//   }, [points, widthSegments, dateSegments]);

//   return (
//     <mesh geometry={geometry}>
//       <meshStandardMaterial
//         vertexColors
//         side={THREE.DoubleSide}
//         transparent
//         opacity={0.8}
//       />
//     </mesh>
//   );
// }

// function Scene({
//   points,
//   weightGuess,
//   muWeight,
//   guessPrice,
//   birthDateDeviation,
//   widthSegments,
//   dateSegments,
//   weightScale,
// }: {
//   points: THREE.Vector3[];
//   weightGuess: number;
//   muWeight: number;
//   guessPrice: number;
//   birthDateDeviation: number;
//   widthSegments: number;
//   dateSegments: number;
//   weightScale: number;
// }) {
//   const { position, fov } = useControls({
//     position: {
//       value: [10, 30, 15],
//       step: 1,
//     },
//     fov: {
//       value: 90,
//       min: 10,
//       max: 120,
//     },
//   });

//   return (
//     <Canvas>
//       <CameraController position={position} fov={fov} />
//       <ambientLight intensity={0.5} />
//       <pointLight position={[10, 10, 10]} />
//       <axesHelper args={[20]} />
//       <gridHelper args={[40, 20]} />
//       <OrbitControls />
//       <group>
//         <Surface
//           points={points}
//           widthSegments={widthSegments}
//           dateSegments={dateSegments}
//         />
//         {points.map((point, i) => (
//           <mesh key={i} position={point}>
//             <sphereGeometry args={[0.1, 8, 8]} />
//             <meshStandardMaterial color="grey" transparent opacity={0.5} />
//           </mesh>
//         ))}
//         <group
//           position={[
//             (weightGuess - muWeight) * weightScale,
//             guessPrice,
//             birthDateDeviation,
//           ]}
//         >
//           <mesh>
//             <sphereGeometry args={[0.5, 32, 32]} />
//             <meshStandardMaterial color="hotpink" />
//           </mesh>
//           <Billboard>
//             <Text
//               position={[0, 2, 0]}
//               fontSize={1.5}
//               color="black"
//               anchorX="center"
//               anchorY="middle"
//             >
//               {`$${guessPrice.toFixed(2)}`}
//             </Text>
//           </Billboard>
//           <Billboard>
//             <Text
//               position={[4, 0, 0]}
//               fontSize={1.5}
//               color="black"
//               anchorX="center"
//               anchorY="middle"
//             >
//               {`Weight: ${weightGuess.toFixed(1)} lbs`}
//             </Text>
//           </Billboard>
//           <Billboard>
//             <Text
//               position={[-4, 0, 0]}
//               fontSize={1.5}
//               color="black"
//               anchorX="center"
//               anchorY="middle"
//             >
//               {`Date: ${birthDateDeviation} days`}
//             </Text>
//           </Billboard>
//         </group>
//       </group>
//     </Canvas>
//   );
// }

// export function BabyGuessVisual({
//   pool,
//   birthDateDeviation,
//   weightGuess,
// }: {
//   pool: Tables<"pools">;
//   birthDateDeviation: number;
//   weightGuess: number;
// }) {
//   // Pool parameters with defaults
//   const muWeight = pool.mu_weight ?? 7.6;
//   const weightScale = 7;

//   // Pricing constants from the pool
//   const minBetPrice = pool.price_floor ?? 5;
//   const maxBetPrice = pool.price_ceiling ?? 50;

//   // Each component gets half the price range
//   const minComponentPrice = minBetPrice / 2;
//   const maxComponentPrice = maxBetPrice / 2;

//   const getPrice = useCallback(
//     (dateOffset: number, weight: number) => {
//       const datePrice = getBetComponentPrice({
//         guess: dateOffset,
//         mean: 0,
//         bound: 14,
//         minPrice: minComponentPrice,
//         maxPrice: maxComponentPrice,
//       });
//       const weightPrice = getBetComponentPrice({
//         guess: weight,
//         mean: muWeight,
//         bound: 2,
//         minPrice: minComponentPrice,
//         maxPrice: maxComponentPrice,
//       });
//       return datePrice + weightPrice;
//     },
//     [minComponentPrice, maxComponentPrice, muWeight]
//   );

//   // Generate points for the 3D scatter plot
//   const points = useMemo(() => {
//     const pts: THREE.Vector3[] = [];
//     const dateSegments = 60;
//     const widthSegments = 60;
//     const dateRange = 28; // -14 to 14 days
//     const weightRange = 4; // 5 to 9 lbs

//     for (let i = 0; i <= dateSegments; i++) {
//       const date = (i / dateSegments - 0.5) * dateRange;
//       for (let j = 0; j <= widthSegments; j++) {
//         const weight = 5 + (j / widthSegments) * weightRange;
//         const price = getPrice(date, weight);
//         pts.push(
//           new THREE.Vector3((weight - muWeight) * weightScale, price, date)
//         );
//       }
//     }
//     return pts;
//   }, [getPrice, muWeight, weightScale]);

//   const guessPrice = getPrice(birthDateDeviation, weightGuess);

//   return (
//     <div className="mt-6 h-96">
//       <Scene
//         points={points}
//         weightGuess={weightGuess}
//         muWeight={muWeight}
//         guessPrice={guessPrice}
//         birthDateDeviation={birthDateDeviation}
//         widthSegments={60}
//         dateSegments={60}
//         weightScale={weightScale}
//       />
//     </div>
//   );
// }
