export function exportData(dataObj: any[], fileName: string) {
    // Convert Object to JSON
    const jsonObject = JSON.stringify(dataObj);

    const headers = Object.keys(dataObj[0]);

    let csv = convertToCSV(jsonObject);
    csv = headers.join(',') + '\r\n' + csv;
    const csvContent = 'data:text/csv;charset=utf-8,' + csv;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link); // Required for FF

    link.click(); // This will download the data file named "my_data.csv".
}
function convertToCSV(objArray: any) {
    const array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    let str = '';

    for (let i = 0; i < array.length; i++) {
        let line = '';
        for (const index in array[i]) {
            if (line != '') line += ',';

            line += array[i][index];
        }

        str += line + '\r\n';
    }

    return str;
}
