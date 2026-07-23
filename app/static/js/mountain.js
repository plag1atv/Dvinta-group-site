(() => {
  const canvas = document.getElementById('mountain-canvas');

  if (!canvas) {
    return;
  }

  const context = canvas.getContext('2d', { alpha: true });

  if (!context) {
    return;
  }

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /*
   * Количество граней горы.
   * Чем больше значение, тем гора круглее.
   * Чем меньше значение, тем заметнее low-poly стиль.
   */
  const segmentCount = 18;

  /*
   * Уровни горы сверху вниз.
   *
   * y — высота уровня.
   * radius — ширина уровня.
   */
  const rings = [
    { y: 1.78, radius: 0.92 },
    { y: 0.62, radius: 2.05 },
    { y: -0.56, radius: 3.18 },
    { y: -1.72, radius: 4.42 }
  ];

  /*
   * Самая верхняя точка горы.
   */
  const vertices = [
    {
      x: 0,
      y: 3.18,
      z: 0
    }
  ];

  const faces = [];

  /*
   * Псевдослучайное число.
   * Благодаря этому гора всегда выглядит одинаково,
   * но при этом её поверхность остаётся неровной.
   */
  const noise = (value) => {
    const result =
      Math.sin(value * 12.9898 + 78.233) * 43758.5453;

    return result - Math.floor(result);
  };

  /*
   * Создаём вершины каждого уровня горы.
   */
  rings.forEach((ring, ringIndex) => {
    for (
      let segmentIndex = 0;
      segmentIndex < segmentCount;
      segmentIndex += 1
    ) {
      const angle =
        (segmentIndex / segmentCount) * Math.PI * 2;

      const unevenRadius =
        ring.radius *
        (
          0.84 +
          noise((ringIndex + 1) * 100 + segmentIndex) * 0.28
        );

      const unevenHeight =
        (
          noise((ringIndex + 1) * 210 + segmentIndex) - 0.5
        ) * 0.28;

      vertices.push({
        x: Math.cos(angle) * unevenRadius,
        y: ring.y + unevenHeight,
        z: Math.sin(angle) * unevenRadius
      });
    }
  });

  /*
   * Соединяем вершину горы с первым уровнем.
   */
  for (
    let segmentIndex = 0;
    segmentIndex < segmentCount;
    segmentIndex += 1
  ) {
    const nextSegment =
      (segmentIndex + 1) % segmentCount;

    faces.push({
      indices: [
        0,
        1 + segmentIndex,
        1 + nextSegment
      ],
      seed: noise(500 + segmentIndex)
    });
  }

  /*
   * Соединяем остальные уровни треугольными гранями.
   */
  for (
    let ringIndex = 0;
    ringIndex < rings.length - 1;
    ringIndex += 1
  ) {
    const currentStart =
      1 + ringIndex * segmentCount;

    const nextStart =
      currentStart + segmentCount;

    for (
      let segmentIndex = 0;
      segmentIndex < segmentCount;
      segmentIndex += 1
    ) {
      const nextSegment =
        (segmentIndex + 1) % segmentCount;

      const a = currentStart + segmentIndex;
      const b = currentStart + nextSegment;
      const c = nextStart + segmentIndex;
      const d = nextStart + nextSegment;

      /*
       * Чередуем направление треугольников,
       * чтобы поверхность выглядела естественнее.
       */
      if ((segmentIndex + ringIndex) % 2 === 0) {
        faces.push({
          indices: [a, c, b],
          seed: noise(
            700 + ringIndex * 50 + segmentIndex
          )
        });

        faces.push({
          indices: [b, c, d],
          seed: noise(
            900 + ringIndex * 50 + segmentIndex
          )
        });
      } else {
        faces.push({
          indices: [a, c, d],
          seed: noise(
            1100 + ringIndex * 50 + segmentIndex
          )
        });

        faces.push({
          indices: [a, d, b],
          seed: noise(
            1300 + ringIndex * 50 + segmentIndex
          )
        });
      }
    }
  }

  let width = 0;
  let height = 0;
  let pixelRatio = 1;

  let currentRotation = -0.58;
  let targetRotation = -0.58;

  let currentDrop = 0;
  let targetDrop = 0;

  let animationFrame = null;

  const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
  };

  /*
   * Вращаем точку в трёхмерном пространстве.
   */
  const rotateVertex = (vertex, rotationY) => {
    const cosineY = Math.cos(rotationY);
    const sineY = Math.sin(rotationY);

    const rotatedX =
      vertex.x * cosineY +
      vertex.z * sineY;

    const rotatedZ =
      -vertex.x * sineY +
      vertex.z * cosineY;

    /*
     * Небольшой постоянный наклон,
     * чтобы вершина выглядела объёмнее.
     */
    const tiltX = -0.12;

    const cosineX = Math.cos(tiltX);
    const sineX = Math.sin(tiltX);

    return {
      x: rotatedX,

      y:
        vertex.y * cosineX -
        rotatedZ * sineX,

      z:
        vertex.y * sineX +
        rotatedZ * cosineX
    };
  };

  /*
   * Переводим трёхмерную точку
   * в координаты экрана.
   */
  const projectVertex = (vertex) => {
    const cameraDistance = 9.2;

    /*
     * Этот коэффициент отвечает
     * за общий размер горы.
     */
    const focalLength =
      Math.min(width, height) * 1.04;

    const depth = Math.max(
      cameraDistance + vertex.z,
      1.2
    );

    const perspective =
      focalLength / depth;

    /*
     * Расположение горы.
     *
     * На компьютере она находится справа.
     * На телефоне — ближе к центру.
     */
    const centerX =
      width < 760
        ? width * 0.56
        : width * 0.69;

    const centerY =
      width < 760
        ? height * 0.60
        : height * 0.64;

    return {
      x:
        centerX +
        vertex.x * perspective,

      y:
        centerY -
        vertex.y * perspective +
        currentDrop,

      z: vertex.z
    };
  };

  /*
   * Рассчитываем цвет каждой грани.
   */
  const getFaceColor = (
    face,
    rotatedVertices
  ) => {
    const [
      firstIndex,
      secondIndex,
      thirdIndex
    ] = face.indices;

    const first =
      rotatedVertices[firstIndex];

    const second =
      rotatedVertices[secondIndex];

    const third =
      rotatedVertices[thirdIndex];

    const edgeOne = {
      x: second.x - first.x,
      y: second.y - first.y,
      z: second.z - first.z
    };

    const edgeTwo = {
      x: third.x - first.x,
      y: third.y - first.y,
      z: third.z - first.z
    };

    /*
     * Нормаль поверхности нужна,
     * чтобы определить освещённость грани.
     */
    const normal = {
      x:
        edgeOne.y * edgeTwo.z -
        edgeOne.z * edgeTwo.y,

      y:
        edgeOne.z * edgeTwo.x -
        edgeOne.x * edgeTwo.z,

      z:
        edgeOne.x * edgeTwo.y -
        edgeOne.y * edgeTwo.x
    };

    const normalLength =
      Math.hypot(
        normal.x,
        normal.y,
        normal.z
      ) || 1;

    normal.x /= normalLength;
    normal.y /= normalLength;
    normal.z /= normalLength;

    /*
     * Направление виртуального источника света.
     */
    const light = {
      x: -0.42,
      y: 0.78,
      z: 0.46
    };

    const lightAmount = Math.abs(
      normal.x * light.x +
      normal.y * light.y +
      normal.z * light.z
    );

    const averageHeight =
      (
        first.y +
        second.y +
        third.y
      ) / 3;

    let baseColor;

    /*
     * Верхушка светлая — эффект снега.
     */
    if (averageHeight > 1.48) {
      baseColor = [229, 238, 243];
    } else if (averageHeight > 0.15) {
      baseColor = [95, 132, 139];
    } else {
      baseColor = [48, 78, 84];
    }

    const brightness =
      0.62 +
      lightAmount * 0.48 +
      (face.seed - 0.5) * 0.12;

    const red = clamp(
      Math.round(baseColor[0] * brightness),
      0,
      255
    );

    const green = clamp(
      Math.round(baseColor[1] * brightness),
      0,
      255
    );

    const blue = clamp(
      Math.round(baseColor[2] * brightness),
      0,
      255
    );

    return `rgb(${red}, ${green}, ${blue})`;
  };

  /*
   * Рисование горы.
   */
  const draw = () => {
    context.setTransform(
      pixelRatio,
      0,
      0,
      pixelRatio,
      0,
      0
    );

    context.clearRect(
      0,
      0,
      width,
      height
    );

    /*
     * Мягкая тень под горой.
     */
    const shadowX =
      width < 760
        ? width * 0.56
        : width * 0.69;

    const shadowY =
      height * 0.88 +
      currentDrop;

    const shadowWidth =
      Math.min(width, height) * 0.39;

    context.save();

    context.filter = 'blur(24px)';
    context.globalAlpha = 0.16;
    context.fillStyle = '#173c42';

    context.beginPath();

    context.ellipse(
      shadowX,
      shadowY,
      shadowWidth,
      shadowWidth * 0.16,
      0,
      0,
      Math.PI * 2
    );

    context.fill();
    context.restore();

    /*
     * Вращаем и проецируем все вершины.
     */
    const rotatedVertices =
      vertices.map((vertex) => {
        return rotateVertex(
          vertex,
          currentRotation
        );
      });

    const projectedVertices =
      rotatedVertices.map(projectVertex);

    /*
     * Сначала рисуем дальние поверхности,
     * затем ближние.
     */
    const sortedFaces = faces
      .map((face) => {
        return {
          ...face,

          depth:
            face.indices.reduce(
              (sum, vertexIndex) => {
                return (
                  sum +
                  rotatedVertices[vertexIndex].z
                );
              },
              0
            ) / 3
        };
      })
      .sort((firstFace, secondFace) => {
        return secondFace.depth - firstFace.depth;
      });

    sortedFaces.forEach((face) => {
      const [
        firstIndex,
        secondIndex,
        thirdIndex
      ] = face.indices;

      const first =
        projectedVertices[firstIndex];

      const second =
        projectedVertices[secondIndex];

      const third =
        projectedVertices[thirdIndex];

      context.beginPath();

      context.moveTo(
        first.x,
        first.y
      );

      context.lineTo(
        second.x,
        second.y
      );

      context.lineTo(
        third.x,
        third.y
      );

      context.closePath();

      context.fillStyle =
        getFaceColor(
          face,
          rotatedVertices
        );

      context.fill();

      /*
       * Очень тонкие линии между полигонами.
       */
      context.strokeStyle =
        'rgba(238, 247, 248, 0.10)';

      context.lineWidth = 0.7;
      context.stroke();
    });
  };

  /*
   * Плавное движение к нужному положению.
   */
  const animate = () => {
    currentRotation +=
      (
        targetRotation -
        currentRotation
      ) * 0.075;

    currentDrop +=
      (
        targetDrop -
        currentDrop
      ) * 0.085;

    draw();

    const rotationDifference =
      Math.abs(
        targetRotation -
        currentRotation
      );

    const dropDifference =
      Math.abs(
        targetDrop -
        currentDrop
      );

    if (
      rotationDifference > 0.0005 ||
      dropDifference > 0.15
    ) {
      animationFrame =
        window.requestAnimationFrame(animate);
    } else {
      currentRotation = targetRotation;
      currentDrop = targetDrop;

      draw();

      animationFrame = null;
    }
  };

  const startAnimation = () => {
    if (animationFrame === null) {
      animationFrame =
        window.requestAnimationFrame(animate);
    }
  };

  /*
   * Обновляем положение горы при прокрутке.
   */
  const updateFromScroll = () => {
    const scrollPosition =
      window.scrollY || 0;

    /*
     * 0.00135 — скорость вращения.
     */
    targetRotation = reducedMotion
      ? -0.58
      : -0.58 + scrollPosition * 0.00135;

    /*
     * 0.13 — скорость опускания вниз.
     *
     * height * 0.48 ограничивает максимальное
     * опускание, чтобы гора не исчезала мгновенно.
     */
    targetDrop = reducedMotion
      ? 0
      : Math.min(
          scrollPosition * 0.13,
          height * 0.48
        );

    startAnimation();
  };

  /*
   * Настраиваем canvas под размер экрана.
   */
  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;

    pixelRatio = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    canvas.width =
      Math.round(width * pixelRatio);

    canvas.height =
      Math.round(height * pixelRatio);

    canvas.style.width =
      `${width}px`;

    canvas.style.height =
      `${height}px`;

    updateFromScroll();
    draw();
  };

  window.addEventListener(
    'resize',
    resize,
    { passive: true }
  );

  window.addEventListener(
    'scroll',
    updateFromScroll,
    { passive: true }
  );

  resize();
})();