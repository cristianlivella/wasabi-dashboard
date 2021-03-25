const getChartConfig = (title, type) => {
    return {
        type: type,
        data: {
            datasets: [{
                data: [-1],
                label: 'Loading...',
            }],
            labels: ['Loading...'],
        },
        options: {
            cutoutPercentage: type === 'doughnut' ? 40 : 0,
            responsive: true,
            maintainAspectRatio: type === 'line' ? false : true,
            legend: {
                display: type === 'line',
            },
            title: {
                display: true,
                fontSize: 18,
                fontColor: '#212529',
                text: title,
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        if (data.datasets[0].data[tooltipItem.index] < 0) {
                            return 'Loading...';
                        }
                        if (type === 'line') {
                            return data.datasets[tooltipItem.datasetIndex].label + ': ' + formatBytes(tooltipItem.value)
                        }
                        return data.labels[tooltipItem.index] + ': ' + formatBytes(data.datasets[0].data[tooltipItem.index])
                    }
                },
                mode: 'index',
                intersect: true,
                position: 'nearest',
            },
            elements: {
                center: {
                    text: type === 'doughnut' ? 'Loading...' : '',
                    color: '#212529',
                }
            },
            scales: {
                yAxes: type === 'line' ? [
                    {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        id: 'y-axis-1',
                        ticks: {
                            beginAtZero: true,
                            callback: function(value) {
                                if (value < 1) {
                                    return formatBytes(0);
                                }
                                return formatBytes(value);
                            },
                        },
                        scaleLabel: {
                            display: true,
                            labelString: ''
                        }
                    }
                ] : []
            },
        },
    };
}

const storageUsagePalette = ['#117733', '#66a61e', '#ff0029', '#377eb8', '#ff7f00'];

const generateColors = (num, paletteName = 'mpn65') => {
    const scheme = palette.listSchemes(paletteName)[0];
    return scheme.apply(scheme, [num]).reverse().map(color => {
        return '#' + color;
    })
}

const getBucketsColors = (buckets) => {
    return buckets.map(bucket => {
        return bucket.color;
    })
}

const getLabels = (buckets) => {
    return buckets.map(bucket => {
        return bucket.name;
    })
}

const sortByProperty = (buckets, property) => {
    buckets.sort((a, b) => {
        if (a[property] < b[property]) return -1;
        if (a[property] > b[property]) return 1;
        return 0;
    })
}

const getData = (buckets, property) => {
    return buckets.map(bucket => {
        return bucket[property];
    })
}

const getLineChartDatasets = (history) => {
    const colors = storageUsagePalette
    const labels = ['Billable storage', 'Active storage', 'Deleted storage', 'Padding data', 'Metadata'];
    return ['billable', 'size', 'deleted', 'padding', 'metadata'].map((property, i) => {
        return {
            label: labels[i],
            data: history.map(day => {
                if (property === 'billable')
                    return day['size'] + day['deleted'] + day['padding'];
                else if (property === 'size')
                    return day['size'] - day['metadata'];
                return day[property]
            }).reverse(),
            borderColor: [colors[i]],
            backgroundColor: colors[i],
            fill: false,
        }
    })
}

const getDaysList = (history) => {
    return history.map(day => {
        return day.date;
    }).reverse();
}

const formatBytes = (bytes, decimals = 2) => {
    // Source: https://stackoverflow.com/a/18650828/6268326
    bytes = parseInt(bytes)
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


const charts = [
    {
        title: 'Active storage by buckets',
        type: 'doughnut',
    },
    {
        title: 'Deleted storage by buckets',
        type: 'doughnut',
    },
    {
        title: 'Padding data by buckets',
        type: 'doughnut',
    },
    {
        title: 'Billable storage usage',
        type: 'doughnut',
    },
    {
        title: 'Storage usage history',
        type: 'line',
    }
].map((chart, i) => {
    return new Chart(document.getElementById('chart' + i).getContext('2d'), getChartConfig(chart.title, chart.type))
})

const updateData = () => {
    fetch('data.php').then(response => response.json()).then(data => {
        let {buckets, total} = data;
        const totalToday = total[0];

        const colors = generateColors(buckets.length);
        sortByProperty(buckets, 'size');
        buckets = buckets.map((bucket, i) => {
            return {...bucket, color: colors[i]}
        })

        charts[0].config.data.labels = getLabels(buckets);
        charts[0].config.data.datasets[0].data = getData(buckets, 'size');
        charts[0].config.data.datasets[0].backgroundColor = getBucketsColors(buckets);
        charts[0].config.options.elements.center.text = formatBytes(totalToday.size);
        charts[0].update();

        sortByProperty(buckets, 'deleted')
        charts[1].config.data.labels = getLabels(buckets);
        charts[1].config.data.datasets[0].data = getData(buckets, 'deleted');
        charts[1].config.data.datasets[0].backgroundColor = getBucketsColors(buckets);
        charts[1].config.options.elements.center.text = formatBytes(totalToday.deleted);
        charts[1].update();

        sortByProperty(buckets, 'padding')
        charts[2].config.data.labels = getLabels(buckets);
        charts[2].config.data.datasets[0].data = getData(buckets, 'padding');
        charts[2].config.data.datasets[0].backgroundColor = getBucketsColors(buckets);
        charts[2].config.options.elements.center.text = formatBytes(totalToday.padding);
        charts[2].update();

        charts[3].config.data.labels = ['Active storage', 'Deleted storage', 'Padding data', 'Metadata'].reverse();
        charts[3].config.data.datasets[0].data = [totalToday.size - totalToday.metadata, totalToday.deleted, totalToday.padding, totalToday.metadata].reverse();
        charts[3].config.data.datasets[0].backgroundColor = storageUsagePalette.slice(1).reverse();
        charts[3].config.options.elements.center.text = formatBytes(totalToday.size + totalToday.deleted + totalToday.padding);
        charts[3].update();

        charts[4].config.data.datasets = getLineChartDatasets(total);
        charts[4].config.data.labels = getDaysList(total);
        charts[4].update();
    });
}

updateData();
setInterval(() => {
    updateData();
}, 60 * 60 * 2 * 1000);
