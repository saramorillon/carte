;(function () {
  function parseCsv(csv) {
    const departments = []

    const [header, weight, ideal, ...lines] = csv.trim().split(/\r?\n/)
    const [, , ...headers] = header.split(';')
    const [, , ...weights] = weight.split(';')
    const [, , ...ideals] = ideal.split(';')

    const totalWeight = weights.reduce((acc, curr) => acc + Number(curr), 0)

    for (let i = 0; i < lines.length; i++) {
      const [code, name, ...values] = lines[i].split(';')

      departments[i] = departments[i] || { code, name, value: 0, indicators: [] }

      for (let j = 0; j < values.length; j++) {
        departments[i].indicators[j] = {
          name: headers[j],
          weight: Number(weights[j]),
          value: Number(values[j]),
          ideal: Number(ideals[j]),
          gap: Math.abs(Number(ideals[j]) - Number(values[j])),
        }
      }
    }

    const variants = new Array(headers.length).fill(0).map(() => ({}))

    for (const department of departments) {
      for (let i = 0; i < department.indicators.length; i++) {
        const indicator = department.indicators[i]
        const variant = variants[i]
        variant.min = !variant.min ? indicator.gap : Math.min(variant.min, indicator.gap)
        variant.max = !variant.max ? indicator.gap : Math.max(variant.max, indicator.gap)
      }
    }

    for (const department of departments) {
      for (let i = 0; i < department.indicators.length; i++) {
        const indicator = department.indicators[i]
        const variant = variants[i]
        indicator.quality = 1 - (indicator.gap - variant.min) / (variant.max - variant.min)
        department.value += (indicator.quality * (indicator.weight * 100)) / totalWeight
      }
    }

    return departments
  }

  function formatIndicator(indicator) {
    const value = Math.round(indicator.value)
    const quality = Math.round(indicator.quality * 100)
    return `<li>${indicator.name} : ${value} (${quality}%)</li>`
  }

  function formatTooltip(params) {
    const indicators = params.data.indicators.sort((i1, i2) => i2.weight - i1.weight)
    return `<b>${params.data.code} - ${params.data.name} : ${Math.round(params.data.value)}%</b>
    <ul>
    ${indicators.map(formatIndicator).join('')}
    </ul>`
  }

  function onCsv() {
    const departments = parseCsv(this.result)

    chart.setOption({
      tooltip: { formatter: formatTooltip },
      visualMap: {
        min: Math.min(...departments.map((department) => department.value)),
        max: Math.max(...departments.map((department) => department.value)),
        inRange: { color: ['red', 'yellow', 'green'] },
        text: ['Qualité élevée', 'Basse qualité'],
      },
      series: [
        { top: 0, left: 0, bottom: 0, right: 0, name: 'Qualité', type: 'map', map: 'France', data: departments },
      ],
    })
  }

  echarts.registerMap('France', { geoJSON })

  const theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark2' : 'light'

  const container = document.getElementById('map')
  const chart = echarts.init(container, theme)
  chart.setOption({ geo: { top: 0, left: 0, bottom: 0, right: 0, map: 'France' } })

  document.querySelector('input').addEventListener('change', (e) => {
    const reader = new FileReader()
    reader.onload = onCsv
    reader.readAsText(e.target.files[0])
  })
})()
