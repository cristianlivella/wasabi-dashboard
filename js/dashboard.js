const getChartConfig = (title, type) => {
    return {
        type: type,
        data: {
            datasets: [{
                data: [-1],
            }],
            labels: ['Loading...'],
        },
        options: {
            cutoutPercentage: type === 'doughnut' ? 40 : 0,
            responsive: true,
            legend: {
                display: false,
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
                        return data.labels[tooltipItem.index] + ': ' + formatBytes(data.datasets[0].data[tooltipItem.index])
                    }
                }
            },
            elements: {
                center: {
                    text: type === 'doughnut' ? 'Loading...' : '',
                    color: '#212529',
                }
            }
        },
    };
}

const charts = ['Used storage by buckets', 'Deleted storage by buckets', 'Padding data by buckets', 'Deleted storage and padding'].map((title, i) => {
    return new Chart(document.getElementById('chart' + i).getContext('2d'), getChartConfig(title, (i < 3 ? 'doughnut' : 'pie')))
})

const generateColors = (num) => {
    const scheme = palette.listSchemes('mpn65')[0];
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

const formatBytes = (bytes, decimals = 2) => {
    // Source: https://stackoverflow.com/a/18650828/6268326
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const updateData = () => {
    fetch('data.php').then(response => response.json()).then(data => {
        let {buckets, total} = data

        const colors = generateColors(buckets.length)
        sortByProperty(buckets, 'size')
        buckets = buckets.map((bucket, i) => {
            return {...bucket, color: colors[i]}
        })

        charts[0].config.data.labels = getLabels(buckets);
        charts[0].config.data.datasets[0].data = getData(buckets, 'size');
        charts[0].config.data.datasets[0].backgroundColor = getBucketsColors(buckets)
        charts[0].config.options.elements.center.text = formatBytes(total.size)
        charts[0].update()

        sortByProperty(buckets, 'deleted')
        charts[1].config.data.labels = getLabels(buckets);
        charts[1].config.data.datasets[0].data = getData(buckets, 'deleted');
        charts[1].config.data.datasets[0].backgroundColor = getBucketsColors(buckets)
        charts[1].config.options.elements.center.text = formatBytes(total.deleted)
        charts[1].update()

        sortByProperty(buckets, 'padding')
        charts[2].config.data.labels = getLabels(buckets);
        charts[2].config.data.datasets[0].data = getData(buckets, 'padding');
        charts[2].config.data.datasets[0].backgroundColor = getBucketsColors(buckets)
        charts[2].config.options.elements.center.text = formatBytes(total.padding)
        charts[2].update()

        charts[3].config.data.labels = ['Active storage', 'Deleted storage', 'Padding data']
        charts[3].config.data.datasets[0].data = [total.size - total.deleted - total.padding, total.deleted, total.padding]
        charts[3].config.data.datasets[0].backgroundColor = generateColors(3)
        charts[3].update()
    });
}

updateData();
setInterval(() => {
    updateData();
}, 60 * 60 * 2 * 1000);
