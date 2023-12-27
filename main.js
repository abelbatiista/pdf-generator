const httpModule = require('http');
const fileStreamModule = require('fs');
const pathModule = require('path');
const urlModule = require('url');
const winstonModule = require('winston');
const { 
    format: winstonFormat ,
    transports: winstonTransports,
} = winstonModule;
const pdfModule = require('pdf-lib');
const { degrees, PDFDocument, rgb, StandardFonts } = pdfModule;
const chartModule = require('chart.js') ;
const canvasModule = require('canvas');
const axiosModule = require('axios');
const uuidModule = require('uuid');
const { v4: uuidv4 } = uuidModule;

chartModule.Chart.register( ...chartModule.registerables );

const loggerFormat = winstonFormat.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = winstonModule.createLogger({
    level: 'info',
    format: winstonFormat.combine(
        winstonFormat.colorize(),
        winstonFormat.timestamp(),
        loggerFormat,
    ),
    transports: [
        new winstonTransports.Console(),
        new winstonTransports.File({ filename: 'combined.log' }),
    ],
});

const parseToCurrency = (value) => {
    value = parseFloat(value).toFixed(2);
    return `RD$ ${value}`;
};

const responseFormat = {
    FILE: 'file',
    BASE64: 'base64',
    STREAM: 'stream',
};

const headerCode = '1234';

const httpMethods = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
};

const ok = (response, data, message) => {
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({
        ok: true,
        status: 'OK',
        code: '200',
        message: message || 'SUCCESS',
        data,
    }));
}

const fileCreated = (response, file) => {
    response.writeHead(201, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=account-status-filled.pdf',
    });
    response.end(file);
}

const streamCreated = (response, stream) => {
    response.writeHead(201, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=account-status-filled.pdf',
    });
    stream.pipe(response);
}

const created = (response, data, message) => {
    response.writeHead(201, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({
        ok: true,
        status: 'CREATED',
        code: '201',
        message: message || 'SUCCESS',
        data,
    }));
}

const badRequest = (response, message) => {
    response.writeHead(400, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({
        ok: false,
        status: 'BAD REQUEST',
        code: 400,
        message: message || 'ERROR',
        data: null,
    }));
};

const unauthorized = (response, message) => {
    response.writeHead(401, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({
        ok: false,
        status: 'UNAUTHORIZED',
        code: 401,
        message: message || 'ERROR',
        data: null,
    }));
};

const forbidden = (response, message) => {
    response.writeHead(403, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({
        ok: false,
        status: 'FORBIDDEN',
        code: 403,
        message: message || 'ERROR',
        data: null,
    }));
};

const notFound = (response, message) => {
    response.writeHead(404, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({
        ok: false,
        status: 'NOT FOUND',
        code: 404,
        message: message || 'ERROR',
        data: null,
    }));
};

const methodNotAllowed = (response, message) => {
    response.writeHead(405, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({
        ok: false,
        status: 'METHOD NOT ALLOWED',
        code: 405,
        message: message || 'ERROR',
        data: null,
    }));
};

const baseUri = 'https://ij30r0cgvd.execute-api.us-east-1.amazonaws.com';
const environment = 'DEV';
const layout = 'core';
const structure = 'fo';
const apiController = 'cuenta';
const apiControllerPath = 'edc';
const apiUri = `${baseUri}/${environment}/${layout}/${structure}/${apiController}/${apiControllerPath}`;

const apiHeaders = {
    'x-api-key': 'd39sAyVzgk1hQw5PjUg6q5VrY1HxtksO6N56tXNk',
    traceId: uuidv4(),
    dateTime: new Date().toISOString(),
};

const apiOptions = {
    headers: {...apiHeaders},
    responseType: 'json',
    timeout: 10000,
};

const getEdcData = async () => {
    const route = 'get-data';
    const accountCode = '1000';
    const period = '122014';
    const batchNumber = '64';
    const uri = `${apiUri}/${route}/${accountCode}/${period}/${batchNumber}`;
    const response = await axiosModule.get(uri, {
        ...apiOptions,
        params: {
           canal: 'AppMovil',
        },
    });
    return response;
};

const getEdcPeriods = async () => {
    const route = 'get-periodos';
    const userDni = '01600089864';
    const uri = `${apiUri}/${route}/${userDni}`;
    const response = await axiosModule.get(uri, {
        ...apiOptions,
        params: {
           canal: 'PortalBe',
        },
    });
    return response;
};

const server = httpModule.createServer((request, response) => {
    const authHederKey = 'afp-code';
    const { 
        url,
        method: requestMethod,
        body,
        headers,
        headers: {
            [authHederKey]: authHeader,
        },
    } = request;
    
    if(!authHeader) {
        unauthorized(response, 'INVALID_HEADERS');
        return;
    }

    if(authHeader !== headerCode) {
        forbidden(response, 'INVALID_CODE');
        return;
    }

    const urlSplitted = url.split('/');
    if(urlSplitted.length < 2 || !url || !([...urlSplitted].pop())) {
        notFound(response, 'NOT_FOUND');
        return;
    }

    const [ , apiPrefix,] = urlSplitted;
    
    if(apiPrefix !== 'api') {
        notFound(response, 'API_PREFIX_NOT_FOUND');
        return;
    }
    const urlParsed = urlModule.parse(url, true);
    const { query: urlQueryParams, pathname } = urlParsed;
    const method = requestMethod.toUpperCase();

    const pathWithNoApi = pathname.replace('/api/', '');
    const pathWithNoQuerys = [...pathWithNoApi.split('?')].shift();
    const pathRoutes = [...pathWithNoQuerys.split('/')];
    const [controller,] = [...pathRoutes];

    switch(controller) {
        case 'pdf':
            if(method === httpMethods.POST) {

                let bodyString = '';

                request.on('data', (chunk) => {
                    bodyString += chunk.toString();
                });

                request.on('end', async () => {
                    try {
                        const {
                            summaryAmounts: {
                                initialAmount,
                                periodAmount,
                                periodPerformanceAmount,
                                expenses,
                                individualAmount,
                            },
                        } = JSON.parse(bodyString);

                        // const edcDataResponse = await getEdcData();
                        // const edcObjectData = edcDataResponse.data;
                        // if(!edcObjectData || !edcObjectData.payload || !edcObjectData.payload.data) {
                        //     badRequest(response, 'API AFP Siembra Failed');
                        //     return;
                        // }
                        // const { payload: {
                        //     data: edcData,
                        // } } = edcObjectData;

                        // const edcPeriodsResponse = await getEdcPeriods();
                        // const edcPeriodsObjectData = edcPeriodsResponse.data;
                        // if(!edcPeriodsObjectData || !edcPeriodsObjectData.payload || !edcPeriodsObjectData.payload.data) {
                        //     badRequest(response, 'API AFP Siembra Failed');
                        //     return;
                        // }
                        // const { payload: {
                        //     data: edcPeriods,
                        // } } = edcPeriodsObjectData;

                        // console.log({
                        //     edcData,
                        //     edcPeriods,
                        // })

                        let format = '';
                        if(!!urlQueryParams && urlQueryParams['response-format'])
                            format = urlQueryParams['response-format'];

                        // const chartData = {
                        //     datasets: [
                        //         {
                        //             data: [10, 20, 30],
                        //             backgroundColor: ['red', 'blue', 'green'],
                        //         },
                        //     ],
                        //     labels: ['Jamón', 'Chinola', 'Yuca'],
                        // };
                        // const canvas = canvasModule.createCanvas(400, 400);
                        // const canvasContext = canvas.getContext('2d');
                        // new chartModule.Chart(canvasContext, {
                        //     type: 'pie',
                        //     data: chartData,
                        //     options: {
                        //         legend: {
                        //             display: true,
                        //         },
                        //     },
                        // });

                        const filesFolder = `${__dirname}/assets`;
                        const pdfFolder = `${filesFolder}/pdf/`;
                        const imgFolder = `${filesFolder}/img/`;

                        const fileTemplateName = 'account-status-template.pdf';
                        const fileTemplatePath = pathModule.join(pdfFolder, fileTemplateName);

                        const fileFilledName = 'account-status-filled.pdf';
                        const fileFilledPath = pathModule.join(pdfFolder, fileFilledName);

                        const footerImgName = 'account-status-footer.png';
                        const footerImgPath = pathModule.join(imgFolder, footerImgName);
                        
                        const chartToolImgName = 'chart-tool.png';
                        const chartToolImgPath = pathModule.join(imgFolder, chartToolImgName);

                        const chartCurrencyImgName = 'chart-currency.png';
                        const chartCurrencyImgPath = pathModule.join(imgFolder, chartCurrencyImgName);

                        const fileArrayBuffer = fileStreamModule.readFileSync(fileTemplatePath);
                        const filePdf = await PDFDocument.load(fileArrayBuffer);

                        const footerImgArrayBuffer = fileStreamModule.readFileSync(footerImgPath);
                        const footerImg = await filePdf.embedPng(footerImgArrayBuffer);
                        
                        const chartToolImgArrayBuffer = fileStreamModule.readFileSync(chartToolImgPath);
                        const chartToolImg = await filePdf.embedPng(chartToolImgArrayBuffer);

                        const chartCurrencyImgArrayBuffer = fileStreamModule.readFileSync(chartCurrencyImgPath);
                        const chartCurrencyImg = await filePdf.embedPng(chartCurrencyImgArrayBuffer);

                        // const chartBuffer = canvas.toBuffer('image/png');
                        // const chartImgName = 'chart.png';
                        // const chartImgPath = pathModule.join(imgFolder, chartImgName);

                        // if(fileStreamModule.existsSync(chartImgPath)) {
                        //     fileStreamModule.unlinkSync(chartImgPath);
                        // }

                        // fileStreamModule.writeFileSync(chartImgPath, chartBuffer);

                        const helveticaBoldFont = await filePdf.embedFont(StandardFonts.HelveticaBold)
                        const pdfPages = filePdf.getPages();
                        const pdfFirstPage = pdfPages[0];
                        const { width: firstPageWidth, height: firstPageHeight } = pdfFirstPage.getSize();;

                        const initialAmountParsed = parseToCurrency(initialAmount);
                        const initialAmountSize = helveticaBoldFont.widthOfTextAtSize(initialAmountParsed, 10);
                        pdfFirstPage.drawText(initialAmountParsed, {
                            x: firstPageWidth - 480 - initialAmountSize,
                            y: firstPageHeight - 283,
                            size: 10,
                            font: helveticaBoldFont,
                            color: rgb(0, 0, 0),
                            rotate: degrees(0),
                        });

                        const periodAmountParsed = parseToCurrency(periodAmount);
                        const periodAmountSize = helveticaBoldFont.widthOfTextAtSize(periodAmountParsed, 10);
                        pdfFirstPage.drawText(periodAmountParsed, {
                            x: firstPageWidth - 372 - periodAmountSize,
                            y: firstPageHeight - 283,
                            size: 10,
                            font: helveticaBoldFont,
                            color: rgb(0, 0, 0),
                            rotate: degrees(0),
                        });

                        const periodPerformanceAmountParsed = parseToCurrency(periodPerformanceAmount);
                        const periodPerformanceAmountSize = helveticaBoldFont.widthOfTextAtSize(periodPerformanceAmountParsed, 10);
                        pdfFirstPage.drawText(periodPerformanceAmountParsed, {
                            x: firstPageWidth - 264 - periodPerformanceAmountSize,
                            y: firstPageHeight - 283,
                            size: 10,
                            font: helveticaBoldFont,
                            color: rgb(0, 0, 0),
                            rotate: degrees(0),
                        });

                        const expensesParsed = parseToCurrency(expenses);
                        const expensesSize = helveticaBoldFont.widthOfTextAtSize(expensesParsed, 10);
                        pdfFirstPage.drawText(expensesParsed, {
                            x: firstPageWidth - 156 - expensesSize,
                            y: firstPageHeight - 283,
                            size: 10,
                            font: helveticaBoldFont,
                            color: rgb(0, 0, 0),
                            rotate: degrees(0),
                        });

                        const individualAmountParsed = parseToCurrency(individualAmount);
                        pdfFirstPage.drawText(individualAmountParsed, {
                            x: (firstPageWidth / 2) + (250 - (individualAmountParsed.length * 4.8)), //190
                            y: firstPageHeight - 283,
                            size: 10,
                            font: helveticaBoldFont,
                            color: rgb(0, 0, 0),
                            rotate: degrees(0),
                            
                        });

                        pdfFirstPage.drawText('este es un texto', {
                            x: firstPageWidth - 200,
                            y: firstPageHeight / 2,
                            size: 10,
                            font: helveticaBoldFont,
                            color: rgb(0, 0, 0),
                            rotate: degrees(0),
                            
                        });

                        pdfFirstPage.drawImage(footerImg, {
                            x: 40,
                            y: 40,
                            width: firstPageWidth - 80,
                            height: firstPageHeight - 752,
                        });

                        pdfFirstPage.drawImage(chartToolImg, {
                            x: (firstPageWidth / 2) + 55,
                            y: firstPageHeight / 2 - 175,
                            width: (firstPageWidth - 80) * 0.4,
                            height: (firstPageHeight - 752) * 2,
                        });

                        pdfFirstPage.drawImage(chartCurrencyImg, {
                            x: (firstPageWidth / 2) + 55,
                            y: firstPageHeight / 2 - 270,
                            width: (firstPageWidth - 80) * 0.4,
                            height: (firstPageHeight - 752) * 2,
                        });

                        const pdfBytes = await filePdf.save();

                        if(fileStreamModule.existsSync(fileFilledPath)) {
                            fileStreamModule.unlinkSync(fileFilledPath);
                        }

                        fileStreamModule.writeFileSync(fileFilledPath, pdfBytes);

                        
                        switch(format) {
                            case responseFormat.BASE64:
                                const fileBuffer = fileStreamModule.readFileSync(fileFilledPath);
                                const fileBase64 = fileBuffer.toString();
                                created(response, {
                                    base64: fileBase64,
                                });
                                return;
                            case responseFormat.STREAM:
                                const stream = fileStreamModule.createReadStream(fileFilledPath);
                                streamCreated(response, stream);
                                return;
                            case responseFormat.FILE:
                                fileStreamModule.readFile(fileFilledPath, (error, file) => {
                                    if(!!error)
                                        badRequest(response, 'ERROR_PROCESSING_FILE');
                                    else
                                        fileCreated(response, file);
                                });
                                return;
                            default:
                                badRequest(response, 'NOT_FORMAT_SPECIFIED');
                                return;
                        }
                    } catch (error) {
                        console.log(error);
                        badRequest(response, error.message);
                        return;
                    }
                });
            }
            else {
                methodNotAllowed(response, 'INVALID_METHOD');
                return;
            }
            return;
        default:
            notFound(response, 'INVALID_CONTROLLER');
            return;
    }
});

server.listen(9000, () => {
    console.log('listening on http://localhost:9000/');
});