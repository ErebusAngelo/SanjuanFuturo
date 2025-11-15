// ============================================
// MEGA ALGORITMO DE GENERACIÓN DE PROMPTS
// Adaptado de promptgenerator2.html para pantalla3.html
// ============================================

class MegaPromptGenerator {
    constructor() {
        // Plantillas visuales específicas por categoría y concepto
        this.visualTemplates = {
            // INNOVACIÓN Y TECNOLOGÍA
            'inteligencia artificial': {
                scene: 'centro de investigación con pantallas holográficas',
                elements: ['robots colaborativos', 'displays de datos flotantes', 'laboratorio moderno']
            },
            'robótica': {
                scene: 'fábrica automatizada con robots industriales',
                elements: ['brazos robóticos precisos', 'líneas de producción inteligentes', 'drones de inspección']
            },
            'transformación digital': {
                scene: 'oficinas modernas con tecnología integrada',
                elements: ['pantallas interactivas', 'espacios de coworking', 'fibra óptica visible']
            },
            'blockchain': {
                scene: 'centro de datos con servidores y visualizaciones de red',
                elements: ['servidores modernos', 'cables de red organizados', 'pantallas de monitoreo']
            },
            'ciberseguridad': {
                scene: 'centro de operaciones de seguridad digital',
                elements: ['múltiples monitores', 'sistemas de alerta', 'equipos de protección']
            },
            
            // AGRICULTURA Y GANADERÍA
            'riego eficiente': {
                scene: 'viñedos con sistema de riego por goteo automatizado',
                elements: ['sensores de humedad', 'tuberías inteligentes', 'paneles de control solar']
            },
            'buenas prácticas agrícolas': {
                scene: 'campos de cultivo con trabajadores y drones agrícolas',
                elements: ['drones fumigadores', 'tractores modernos', 'trabajadores con tablets']
            },
            'agroindustria': {
                scene: 'planta procesadora de alimentos con tecnología limpia',
                elements: ['silos modernos', 'cintas transportadoras', 'empaque automatizado']
            },
            'ganadería sustentable': {
                scene: 'estancia moderna con corrales tecnológicos',
                elements: ['sistemas de alimentación automatizada', 'monitoreo animal', 'pasturas controladas']
            },
            
            // MINERÍA, INDUSTRIA Y COMERCIO
            'industria limpia': {
                scene: 'parque industrial con energía solar',
                elements: ['naves industriales con paneles solares', 'chimeneas con filtros', 'zonas verdes integradas']
            },
            'parques industriales': {
                scene: 'complejo industrial moderno con áreas verdes',
                elements: ['edificios industriales bajos', 'estacionamientos con sombra solar', 'vías de acceso amplias']
            },
            'comercio digital': {
                scene: 'centro logístico con tecnología de distribución',
                elements: ['almacenes automatizados', 'camiones eléctricos', 'códigos QR gigantes']
            },
            'minería responsable': {
                scene: 'operación minera con tecnología de bajo impacto',
                elements: ['maquinaria eléctrica', 'sistemas de filtrado', 'rehabilitación de terrenos']
            },
            
            // TALENTO Y OPORTUNIDADES
            'nuevos empleos': {
                scene: 'campus educativo con estudiantes y tecnología',
                elements: ['aulas con realidad aumentada', 'espacios de innovación', 'talleres prácticos']
            },
            'energías renovables': {
                scene: 'campo de paneles solares con turbinas eólicas',
                elements: ['paneles fotovoltaicos', 'aerogeneradores', 'estaciones de carga eléctrica']
            },
            'turismo': {
                scene: 'centro de visitantes con miradores modernos',
                elements: ['pasarelas de vidrio', 'observatorio', 'señalización digital interactiva']
            },
            'educación digital': {
                scene: 'aulas del futuro con tecnología inmersiva',
                elements: ['realidad virtual', 'pizarras inteligentes', 'espacios colaborativos']
            }
        };

        // Paisajes específicos de San Juan (sin elementos prohibidos)
        this.paisajesSanJuan = [
            'viñedos extensos', 'dique de Ullum', 'cerros áridos de colores', 'valles secos',
            'ciudad de San Juan', 'pueblos del interior', 'rutas de montaña serpenteantes',
            'mercado de productores local', 'plazas históricas', 'observatorio astronómico',
            'campos de olivos', 'parques urbanos modernos', 'barrios tradicionales',
            'terminal de ómnibus', 'costanera del dique', 'montañas áridas',
            'zona desértica', 'oasis de cultivo', 'avenida principal',
            'centro cívico', 'parque de la ciudad', 'zona industrial',
            'campus universitario', 'centro de convenciones', 'estadio provincial'
        ];

        // Descriptores geográficos específicos
        this.descriptoresGeograficos = [
            'clima árido característico', 'montañas secas sin nieve al fondo', 'vegetación desértica adaptada',
            'arquitectura de adobe moderna', 'cielo despejado y luminoso', 'terreno rocoso natural',
            'sierras secas al horizonte', 'paisaje árido único', 'arquitectura baja integrada',
            'ciudad de baja altura', 'edificios horizontales', 'construcción antisísmica',
            'diseño adaptado al desierto', 'materiales locales', 'ventilación natural'
        ];

        // Elementos solarpunk adaptados
        this.elementosSolarpunk = [
            'paneles solares integrados', 'arquitectura verde de baja altura', 'jardines verticales',
            'luces de neón cian', 'estructuras bioluminiscentes', 'energía limpia visible',
            'techos verdes extensos', 'turbinas eólicas discretas', 'pasarelas de vidrio',
            'displays holográficos', 'vehículos eléctricos', 'drones de servicio',
            'iluminación solar nocturna', 'reciclaje avanzado', 'huertas comunitarias',
            'fuentes de agua reciclada', 'fibras ópticas decorativas', 'sensores ambientales',
            'edificios bajos modernos', 'construcciones horizontales', 'plazas tecnológicas',
            'sistemas de purificación de aire', 'materiales biodegradables', 'energía geotérmica'
        ];

        // Modificadores de atmósfera
        this.modificadoresAtmosfera = [
            'al atardecer dorado', 'de noche con cielo estrellado', 'bajo la luz intensa del día',
            'iluminado en tonos turquesa', 'ambiente optimista y futurista', 
            'cielo limpio y cálido', 'noche clara sin contaminación', 'luz solar intensa',
            'atmósfera seca y clara', 'amanecer luminoso', 'mediodía radiante',
            'crepúsculo tecnológico', 'iluminación artificial cálida'
        ];

        // Prompt negativo estándar
        this.promptNegativo = 'palmeras, palm trees, coconut trees, tropical plants, nieve, snow, snowy mountains, ríos, rivers, streams, canales, channels, botes, boats, gondolas, venecia, venice, selva, jungle, tropical, humidity, lluvia, rain, cascadas, waterfalls, montañas nevadas, cordillera nevada, torres residenciales altas, tall residential towers, rascacielos residenciales, residential skyscrapers, apartment towers, edificios de departamentos altos, reflejos en el agua, water reflections, canales de agua, water channels, calles con agua, waterways, lagos, lakes, lagunas, ponds';
    }

    // Función principal para generar prompt desde selecciones de usuario
    generateFromUserSelections(userSelections) {
        console.log('🎨 Generando mega prompt desde selecciones:', userSelections);
        
        // Extraer todas las palabras seleccionadas
        const allSelectedWords = [];
        for (const categoryId in userSelections) {
            if (userSelections[categoryId] && Array.isArray(userSelections[categoryId])) {
                allSelectedWords.push(...userSelections[categoryId]);
            }
        }

        if (allSelectedWords.length === 0) {
            console.warn('⚠️ No hay selecciones de usuario');
            return this.generateFallbackPrompt();
        }

        // Generar múltiples variaciones para máxima diversidad
        const variations = this.generateMultipleVariations(allSelectedWords);
        
        // Seleccionar una variación aleatoria
        const selectedVariation = variations[Math.floor(Math.random() * variations.length)];
        
        console.log('✨ Prompt generado:', selectedVariation.prompt);
        return selectedVariation;
    }

    // Generar múltiples variaciones del prompt
    generateMultipleVariations(selectedWords) {
        const variations = [];
        const numVariations = 5; // Generar 5 variaciones diferentes

        for (let i = 0; i < numVariations; i++) {
            const variation = this.generateSingleVariation(selectedWords, i);
            variations.push(variation);
        }

        return variations;
    }

    // Generar una variación específica
    generateSingleVariation(selectedWords, variationIndex) {
        // Seleccionar 1-3 palabras clave aleatoriamente
        const shuffledWords = [...selectedWords].sort(() => Math.random() - 0.5);
        const numWords = Math.min(Math.floor(Math.random() * 3) + 1, shuffledWords.length);
        const keyWords = shuffledWords.slice(0, numWords);

        // Buscar plantilla visual para la primera palabra clave
        const mainKeyword = keyWords[0];
        const visualTemplate = this.visualTemplates[mainKeyword.toLowerCase()];

        // Seleccionar elementos aleatorios
        const paisaje = this.getRandomElement(this.paisajesSanJuan);
        const geoDescriptor = this.getRandomElement(this.descriptoresGeograficos);
        const atmosfera = this.getRandomElement(this.modificadoresAtmosfera);

        // Seleccionar 2-4 elementos solarpunk
        const numSolarElements = Math.floor(Math.random() * 3) + 2;
        const solarElements = this.getRandomElements(this.elementosSolarpunk, numSolarElements);

        let prompt = '';

        if (visualTemplate) {
            // Usar plantilla visual específica
            prompt = `${visualTemplate.scene} en ${paisaje}, San Juan, Argentina, ${geoDescriptor}`;
            
            // Agregar elementos de la plantilla
            const templateElements = this.getRandomElements(visualTemplate.elements, 2);
            prompt += `, con ${templateElements.join(' y ')}`;
            
            // Agregar otras palabras clave si existen
            if (keyWords.length > 1) {
                const otherKeywords = keyWords.slice(1);
                prompt += `, integrando ${otherKeywords.join(' y ')}`;
            }
        } else {
            // Método tradicional sin plantilla
            prompt = `${paisaje} de San Juan, Argentina, ${geoDescriptor}`;
            prompt += `, enfocado en ${keyWords.join(' y ')}`;
        }

        // Agregar elementos solarpunk
        prompt += `, ${solarElements.join(', ')}`;
        
        // Agregar atmósfera
        prompt += `, ${atmosfera}`;
        
        // Agregar estilo final
        prompt += ', estilo solarpunk futurista, arquitectura moderna de baja altura adaptada al desierto, diseño sustentable';

        // Generar parámetros con variabilidad
        const params = this.generateVariedParameters(variationIndex);

        return {
            prompt: prompt,
            negativePrompt: this.promptNegativo,
            ...params
        };
    }

    // Generar parámetros con variabilidad controlada
    generateVariedParameters(seed = 0) {
        const config = CONFIG.imageGeneration;
        const variability = config.variabilityFactor;

        // Usar seed para generar variaciones consistentes pero diferentes
        const random = (offset = 0) => {
            const x = Math.sin(seed + offset) * 10000;
            return x - Math.floor(x);
        };

        // Aplicar variabilidad a cada parámetro
        const fluxGuidance = Math.max(2.0, Math.min(5.0, 
            config.fluxGuidance + (random(1) - 0.5) * variability * 2
        ));

        const fuerzaSanJuan = Math.max(0.2, Math.min(1.0, 
            config.fuerzaSanJuan + (random(2) - 0.5) * variability
        ));

        const fuerzaSolarpunk = Math.max(0.2, Math.min(1.2, 
            config.fuerzaSolarpunk + (random(3) - 0.5) * variability
        ));

        const steps = Math.max(15, Math.min(30, 
            Math.round(config.steps + (random(4) - 0.5) * variability * 10)
        ));

        return {
            steps: steps,
            sanJuanStrength: parseFloat(fuerzaSanJuan.toFixed(2)),
            solarStrength: parseFloat(fuerzaSolarpunk.toFixed(2)),
            guidance: parseFloat(fluxGuidance.toFixed(1))
        };
    }

    // Generar prompt de fallback si no hay selecciones
    generateFallbackPrompt() {
        const paisaje = this.getRandomElement(this.paisajesSanJuan);
        const geoDescriptor = this.getRandomElement(this.descriptoresGeograficos);
        const solarElements = this.getRandomElements(this.elementosSolarpunk, 3);
        const atmosfera = this.getRandomElement(this.modificadoresAtmosfera);

        const prompt = `${paisaje} de San Juan, Argentina, ${geoDescriptor}, ${solarElements.join(', ')}, ${atmosfera}, estilo solarpunk futurista, arquitectura moderna de baja altura`;

        return {
            prompt: prompt,
            negativePrompt: this.promptNegativo,
            steps: CONFIG.imageGeneration.steps,
            sanJuanStrength: CONFIG.imageGeneration.fuerzaSanJuan,
            solarStrength: CONFIG.imageGeneration.fuerzaSolarpunk,
            guidance: CONFIG.imageGeneration.fluxGuidance
        };
    }

    // Utilidades
    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    getRandomElements(array, count) {
        const shuffled = [...array].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, array.length));
    }
}

// Exportar para uso global
window.MegaPromptGenerator = MegaPromptGenerator;
