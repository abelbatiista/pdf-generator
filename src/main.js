const httpModule = require('http');
const fileStreamModule = require('fs');
const pathModule = require('path');
const urlModule = require('url');
const pdfModule = require('pdf-lib');
const fontkitModule = require('@pdf-lib/fontkit');
const { degrees, PDFDocument, rgb, } = pdfModule;
const axiosModule = require('axios');
const uuidModule = require('uuid');
const { v4: uuidv4 } = uuidModule;
const sharpModule = require('sharp');

const parseToMoney = (value) => {
	return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseToCurrency = (value) => {
	return `RD$ ${parseToMoney(value)}`;
};

const parseCommasToNumber = (value) => {
	const newValue = value.replace(',', '');
	return +newValue;
};

const formatDate = (date) => {
	const currentDate = new Date(date);
	const day = currentDate.getDate();
	const month = currentDate.getMonth() + 1;
	const year = currentDate.getFullYear();
	return `${day}/${month}/${year}`;
};

const formatStringToDate = (stringDate) => {
	const splittedString = stringDate.split('/');
	if(splittedString.length < 3) return new Date();
	const day = +splittedString[0];
	const monthIndex = (+splittedString[1]) - 1;
	const year = +splittedString[2];
	return new Date(year, monthIndex, day);
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
	response.writeHead(200, { 'Content-Type': 'application/json' });
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
	response.writeHead(201, { 'Content-Type': 'application/json' });
	response.end(JSON.stringify({
		ok: true,
		status: 'CREATED',
		code: '201',
		message: message || 'SUCCESS',
		data,
	}));
}

const badRequest = (response, message) => {
	response.writeHead(400, { 'Content-Type': 'application/json' });
	response.end(JSON.stringify({
		ok: false,
		status: 'BAD REQUEST',
		code: 400,
		message: message || 'ERROR',
		data: null,
	}));
};

const unauthorized = (response, message) => {
	response.writeHead(401, { 'Content-Type': 'application/json' });
	response.end(JSON.stringify({
		ok: false,
		status: 'UNAUTHORIZED',
		code: 401,
		message: message || 'ERROR',
		data: null,
	}));
};

const forbidden = (response, message) => {
	response.writeHead(403, { 'Content-Type': 'application/json' });
	response.end(JSON.stringify({
		ok: false,
		status: 'FORBIDDEN',
		code: 403,
		message: message || 'ERROR',
		data: null,
	}));
};

const notFound = (response, message) => {
	response.writeHead(404, { 'Content-Type': 'application/json' });
	response.end(JSON.stringify({
		ok: false,
		status: 'NOT FOUND',
		code: 404,
		message: message || 'ERROR',
		data: null,
	}));
};

const methodNotAllowed = (response, message) => {
	response.writeHead(405, { 'Content-Type': 'application/json' });
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
	headers: { ...apiHeaders },
	responseType: 'json',
	timeout: 10000,
};

const getEdcData = async (accountCode, period, batchNumber) => {
	const route = 'get-data';
	const uri = `${apiUri}/${route}/${accountCode}/${period}/${batchNumber}`;
	const response = await axiosModule.get(uri, {
		...apiOptions,
		params: {
			canal: 'AppMovil',
		},
	});
	return response;
};

const imageRequestOptions = {
	responseType: 'arraybuffer',
};

const getEdcHistoricImage = async () => {
	const uri = 'https://afpsiembrafileshare.file.core.windows.net/notificaciones/EDC/Historico/2023_12/EDC_DISTRIBUCION.gif?sv=2022-11-02&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2029-11-01T23:58:32Z&st=2023-09-12T15:58:32Z&spr=https&sig=ZVVaA%2BrSZVm95YCa8XyESWzNIDmYd6BV%2Fc%2FZyt7flUE%3D';
	const response = await axiosModule.get(uri, { ...imageRequestOptions });
	return response;
};

const getEdcCurrencyImage = async () => {
	const uri = 'https://afpsiembrafileshare.file.core.windows.net/notificaciones/EDC/Historico/2023_12/EDC_MONEDAS.gif?sv=2022-11-02&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2029-11-01T23:58:32Z&st=2023-09-12T15:58:32Z&spr=https&sig=ZVVaA%2BrSZVm95YCa8XyESWzNIDmYd6BV%2Fc%2FZyt7flUE%3D';
	const response = await axiosModule.get(uri, { ...imageRequestOptions });
	return response;
};

const getEdcElementsFooterImage = async () => {
	const uri = 'https://afpsiembrafileshare.file.core.windows.net/notificaciones/EDC/Historico/2023_12/EDC_ELEMENTOS.png?sv=2022-11-02&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2029-11-01T23:58:32Z&st=2023-09-12T15:58:32Z&spr=https&sig=ZVVaA%2BrSZVm95YCa8XyESWzNIDmYd6BV%2Fc%2FZyt7flUE%3D';
	const response = await axiosModule.get(uri, { ...imageRequestOptions });
	return response;
};

const server = httpModule.createServer((request, response) => {
	const authHederKey = 'afp-code';
	const {
		url,
		method: requestMethod,
		headers: {
			[authHederKey]: authHeader,
		},
	} = request;

	if (!authHeader) {
		unauthorized(response, 'INVALID_HEADERS');
		return;
	}

	if (authHeader !== headerCode) {
		forbidden(response, 'INVALID_CODE');
		return;
	}

	const urlSplitted = url.split('/');
	if (urlSplitted.length < 2 || !url || !([...urlSplitted].pop())) {
		notFound(response, 'NOT_FOUND');
		return;
	}

	const [, apiPrefix,] = urlSplitted;

	if (apiPrefix !== 'api') {
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

	switch (controller) {
		case 'pdf':
			if (method === httpMethods.POST) {

				if (!urlQueryParams && !urlQueryParams['response-format']) {
					badRequest(response, 'NOT_FORMAT_SPECIFIED');
					return;
				}

				let bodyString = '';

				request.on('data', (chunk) => {
					bodyString += chunk.toString();
				});

				request.on('end', async () => {
					try {
						const {
							accountCode,
							period,
							batchNumber,
						} = JSON.parse(bodyString);

						const edcDataResponse = await getEdcData(accountCode, period, batchNumber);
						const edcObjectData = edcDataResponse.data;
						if(!edcObjectData || !edcObjectData.payload || !edcObjectData.payload.data) {
						    badRequest(response, 'API AFP Siembra Failed');
						    return;
						}
						const { payload: {
						    data: edcData,
						} } = edcObjectData;

						const edcHistoricImageResponse = await getEdcHistoricImage();
						if (!edcHistoricImageResponse || !edcHistoricImageResponse.data) {
							badRequest(response, 'IMAGE_1_FAILED');
							return;
						}
						const { data: edcHistoricImageData } = edcHistoricImageResponse;
						const edcHistoricImageBuffer = Buffer.from(edcHistoricImageData);
						const edcHistoricImageBufferPng = await sharpModule(edcHistoricImageBuffer).toFormat('png').toBuffer();

						const edcCurrencyImageResponse = await getEdcCurrencyImage();
						if (!edcCurrencyImageResponse || !edcCurrencyImageResponse.data) {
							badRequest(response, 'IMAGE_2_FAILED');
							return;
						}
						const { data: edcCurrencyImageData } = edcCurrencyImageResponse;
						const edcCurrencyImageBuffer = Buffer.from(edcCurrencyImageData);
						const edcCurrencyImageBufferPng = await sharpModule(edcCurrencyImageBuffer).toFormat('png').toBuffer();

						const edcElementsFooterImageResponse = await getEdcElementsFooterImage();
						if (!edcElementsFooterImageResponse || !edcElementsFooterImageResponse.data) {
							badRequest(response, 'IMAGE_3_FAILED');
							return;
						}
						const { data: edcElementsFooterImageData } = edcElementsFooterImageResponse;
						const edcElementsFooterImageBuffer = Buffer.from(edcElementsFooterImageData);
						const edcElementsFooterImageBufferPng = await sharpModule(edcElementsFooterImageBuffer).toFormat('png').toBuffer();

						const {
							fecDesde,
							fecHasta,
							nomCliente,
							email,
							telefono,
							direccion1,
							direccion2,
							direccion3,
							direccion4,
							canMesesAfiliado,
							canCotizaciones,
							fecAfiliacion,
							cortes: [
								{
									concepto: concepto_0,
									mtoMesAnio01: mtoMesAnio01_0,
									mtoMesAnio02: mtoMesAnio02_0,
									mtoMesAnio03: mtoMesAnio03_0,
								},
								{
									concepto: concepto_1,
									mtoMesAnio01: mtoMesAnio01_1,
									mtoMesAnio02: mtoMesAnio02_1,
									mtoMesAnio03: mtoMesAnio03_1,
								},
								{
									concepto: concepto_2,
									mtoMesAnio01: mtoMesAnio01_2,
									mtoMesAnio02: mtoMesAnio02_2,
									mtoMesAnio03: mtoMesAnio03_2,
								},
								{
									concepto: concepto_3,
									mtoMesAnio01: mtoMesAnio01_3,
									mtoMesAnio02: mtoMesAnio02_3,
									mtoMesAnio03: mtoMesAnio03_3,
								},
								{
									concepto: concepto_4,
									mtoMesAnio01: mtoMesAnio01_4,
									mtoMesAnio02: mtoMesAnio02_4,
									mtoMesAnio03: mtoMesAnio03_4,
								},
								{
									concepto: concepto_5,
									mtoMesAnio01: mtoMesAnio01_5,
									mtoMesAnio02: mtoMesAnio02_5,
									mtoMesAnio03: mtoMesAnio03_5,
								},
							],
							saldos: [
								{ mtoSaldo: mtoSaldo1 },
								{ mtoSaldo: mtoSaldo2 },
								{ mtoSaldo: mtoSaldo3 },
								{ mtoSaldo: mtoSaldo4 },
							],
							movimientos: [
								{
									concepto: concepto_00,
									mtoMes1: mtoMes1_00,
									mtoMes2: mtoMes2_00,
									mtoMes3: mtoMes3_00,
									mtoMes4: mtoMes4_00,
									mtoMes5: mtoMes5_00,
									mtoMes6: mtoMes6_00,
								},
								{
									concepto: concepto_01,
									mtoMes1: mtoMes1_01,
									mtoMes2: mtoMes2_01,
									mtoMes3: mtoMes3_01,
									mtoMes4: mtoMes4_01,
									mtoMes5: mtoMes5_01,
									mtoMes6: mtoMes6_01,
								},
								{
									concepto: concepto_02,
									mtoMes1: mtoMes1_02,
									mtoMes2: mtoMes2_02,
									mtoMes3: mtoMes3_02,
									mtoMes4: mtoMes4_02,
									mtoMes5: mtoMes5_02,
									mtoMes6: mtoMes6_02,
								},
								{
									concepto: concepto_03,
									mtoMes1: mtoMes1_03,
									mtoMes2: mtoMes2_03,
									mtoMes3: mtoMes3_03,
									mtoMes4: mtoMes4_03,
									mtoMes5: mtoMes5_03,
									mtoMes6: mtoMes6_03,
								},
								{
									concepto: concepto_04,
									mtoMes1: mtoMes1_04,
									mtoMes2: mtoMes2_04,
									mtoMes3: mtoMes3_04,
									mtoMes4: mtoMes4_04,
									mtoMes5: mtoMes5_04,
									mtoMes6: mtoMes6_04,
								},
								{
									concepto: concepto_05,
									mtoMes1: mtoMes1_05,
									mtoMes2: mtoMes2_05,
									mtoMes3: mtoMes3_05,
									mtoMes4: mtoMes4_05,
									mtoMes5: mtoMes5_05,
									mtoMes6: mtoMes6_05,
								},
								{
									concepto: concepto_06,
									mtoMes1: mtoMes1_06,
									mtoMes2: mtoMes2_06,
									mtoMes3: mtoMes3_06,
									mtoMes4: mtoMes4_06,
									mtoMes5: mtoMes5_06,
									mtoMes6: mtoMes6_06,
								},
								{
									concepto: concepto_07,
									mtoMes1: mtoMes1_07,
									mtoMes2: mtoMes2_07,
									mtoMes3: mtoMes3_07,
									mtoMes4: mtoMes4_07,
									mtoMes5: mtoMes5_07,
									mtoMes6: mtoMes6_07,
								},
								{
									concepto: concepto_08,
									mtoMes1: mtoMes1_08,
									mtoMes2: mtoMes2_08,
									mtoMes3: mtoMes3_08,
									mtoMes4: mtoMes4_08,
									mtoMes5: mtoMes5_08,
									mtoMes6: mtoMes6_08,
								},
								{
									concepto: concepto_09,
									mtoMes1: mtoMes1_09,
									mtoMes2: mtoMes2_09,
									mtoMes3: mtoMes3_09,
									mtoMes4: mtoMes4_09,
									mtoMes5: mtoMes5_09,
									mtoMes6: mtoMes6_09,
								},
								{
									concepto: concepto_010,
									mtoMes1: mtoMes1_010,
									mtoMes2: mtoMes2_010,
									mtoMes3: mtoMes3_010,
									mtoMes4: mtoMes4_010,
									mtoMes5: mtoMes5_010,
									mtoMes6: mtoMes6_010,
								},
							],
							fondos: {
								fechaCorte,
								pctComisComp,
								totalComisiones,
								valorCuotaIniRentab,
								valorCuota,
								pctRentAnual,
							},
						} = edcData;

						const format = urlQueryParams['response-format'];

						const filesFolder = `${__dirname}/assets`;
						const pdfFolder = `${filesFolder}/pdf/`;
						const fontsFolder = `${filesFolder}/fonts/`;

						const fileTemplateName = 'account-status-template.pdf';
						const fileTemplatePath = pathModule.join(pdfFolder, fileTemplateName);

						const fileFilledName = 'account-status-filled.pdf';
						const fileFilledPath = pathModule.join(pdfFolder, fileFilledName);

						const evaProLightFontName = 'eva-pro-light.otf';
						const evaProLightFontPath = pathModule.join(fontsFolder, evaProLightFontName);
						const evaProLightFontBytes = fileStreamModule.readFileSync(evaProLightFontPath);

						const evaProNormalFontName = 'eva-pro-normal.otf';
						const evaProNormalFontPath = pathModule.join(fontsFolder, evaProNormalFontName);
						const evaProNormalFontBytes = fileStreamModule.readFileSync(evaProNormalFontPath);

						const evaProSemiboldFontName = 'eva-pro-semibold.otf';
						const evaProSemiboldFontPath = pathModule.join(fontsFolder, evaProSemiboldFontName);
						const evaProSemiboldFontBytes = fileStreamModule.readFileSync(evaProSemiboldFontPath);

						const evaProBoldFontName = 'eva-pro-bold.otf';
						const evaProBoldFontPath = pathModule.join(fontsFolder, evaProBoldFontName);
						const evaProBoldFontBytes = fileStreamModule.readFileSync(evaProBoldFontPath);

						const fileArrayBuffer = fileStreamModule.readFileSync(fileTemplatePath);
						const filePdf = await PDFDocument.load(fileArrayBuffer);

						filePdf.registerFontkit(fontkitModule);

						const edcHistoricImageBufferPngPdf = await filePdf.embedPng(edcHistoricImageBufferPng);
						const edcCurrencyImageBufferPngPdf = await filePdf.embedPng(edcCurrencyImageBufferPng);
						const edcElementsFooterImageBufferPngPdf = await filePdf.embedPng(edcElementsFooterImageBufferPng);

						const evaProLightFont = await filePdf.embedFont(evaProLightFontBytes);
						const evaProNormalFont = await filePdf.embedFont(evaProNormalFontBytes);
						const evaProSemiboldFont = await filePdf.embedFont(evaProSemiboldFontBytes);
						const evaProBoldFont = await filePdf.embedFont(evaProBoldFontBytes);

						const pdfPages = filePdf.getPages();
						const pdfFirstPage = pdfPages[0];
						const { width: firstPageWidth, height: firstPageHeight } = pdfFirstPage.getSize();

						const firstFontSize = 9;
						const secondFontSize = 8;
						const thirdFontSize = 7;
						const fourthFontSize = 6;

						const initialAmountNumber = parseCommasToNumber(mtoSaldo1);
						const initialAmountParsed = parseToCurrency(initialAmountNumber) || parseToCurrency(Math.random() * 50000);
						const initialAmountSize = evaProSemiboldFont.widthOfTextAtSize(initialAmountParsed, firstFontSize);
						pdfFirstPage.drawText(initialAmountParsed, {
							x: firstPageWidth - 480 - initialAmountSize,
							y: firstPageHeight - 283,
							size: firstFontSize,
							font: evaProSemiboldFont,
							color: rgb(0, 0, 0),
							rotate: degrees(0),
						});

						const periodAmountNumber = parseCommasToNumber(mtoSaldo2);
						const periodAmountParsed = parseToCurrency(periodAmountNumber) || parseToCurrency(Math.random() * 10000);
						const periodAmountSize = evaProSemiboldFont.widthOfTextAtSize(periodAmountParsed, firstFontSize);
						pdfFirstPage.drawText(periodAmountParsed, {
							x: firstPageWidth - 372 - periodAmountSize,
							y: firstPageHeight - 283,
							size: firstFontSize,
							font: evaProSemiboldFont,
							color: rgb(0, 0, 0),
							rotate: degrees(0),
						});

						const periodPerformanceAmountNumber = parseCommasToNumber(mtoSaldo3);
						const periodPerformanceAmountParsed = parseToCurrency(periodPerformanceAmountNumber) || parseToCurrency(Math.random() * 1000);
						const periodPerformanceAmountSize = evaProSemiboldFont.widthOfTextAtSize(periodPerformanceAmountParsed, firstFontSize);
						pdfFirstPage.drawText(periodPerformanceAmountParsed, {
							x: firstPageWidth - 264 - periodPerformanceAmountSize,
							y: firstPageHeight - 283,
							size: firstFontSize,
							font: evaProSemiboldFont,
							color: rgb(0, 0, 0),
							rotate: degrees(0),
						});

						const expensesNumber = parseCommasToNumber(mtoSaldo4);
						const expensesParsed = parseToCurrency(expensesNumber) || parseToCurrency(Math.random() * 10000);
						const expensesSize = evaProSemiboldFont.widthOfTextAtSize(expensesParsed, firstFontSize);
						pdfFirstPage.drawText(expensesParsed, {
							x: firstPageWidth - 156 - expensesSize,
							y: firstPageHeight - 283,
							size: firstFontSize,
							font: evaProSemiboldFont,
							color: rgb(0, 0, 0),
							rotate: degrees(0),
						});

						const individualAmountNumber
							= initialAmountNumber
							+ periodAmountNumber
							+ periodPerformanceAmountNumber
							- expensesNumber;
						const individualAmountParsed 
							= parseToCurrency(individualAmountNumber)
							|| parseToCurrency(Math.random() * 1000000);
						const individualAmountSize = evaProSemiboldFont.widthOfTextAtSize(individualAmountParsed, firstFontSize);
						pdfFirstPage.drawText(individualAmountParsed, {
							x: firstPageWidth - 48 - individualAmountSize,
							y: firstPageHeight - 283,
							size: firstFontSize,
							font: evaProSemiboldFont,
							color: rgb(0, 0, 0),
							rotate: degrees(0),

						});

						const cutOffDateSplitted = fechaCorte.split(' ');
						const textCutOff1 = `Al corte del ${cutOffDateSplitted.slice(0, 2).join(' ') || '01 de'}`;
						const textCutOff2 = cutOffDateSplitted.slice(2).join(' ') || 'Abril de 2023';

						const textsCutOffTable = [
							textCutOff1,
							textCutOff2,
						];

						textsCutOffTable.forEach((value, index) => {
							const widthConstant = 50;
							const widthValue = widthConstant;
							const heightConstant = 253;
							const heightRange = index === 0 ? 0 : 7;
							const heightValue = firstPageHeight - heightConstant - heightRange;
							pdfFirstPage.drawText(value, {
								x: widthValue,
								y: heightValue,
								size: thirdFontSize,
								font: evaProNormalFont,
								color: rgb(1, 1, 1),
								rotate: degrees(0),
							});
						});

						const headerKey = 'Período';
						const headerStartDate = fecDesde || '01/06/2023';
						const headerEndDate = fecHasta || '30/09/2023';
						const headerTitle = `${headerKey}: ${headerStartDate} - ${headerEndDate}`;

						pdfFirstPage.drawText(headerTitle, {
							x: 40,
							y: firstPageHeight - 140,
							size: firstFontSize,
							font: evaProSemiboldFont,
							color: rgb(0, 0, 0),
							rotate: degrees(0),
						});

						const informationNameKey = 'Nombre';
						const informationEmailKey = 'Correo Electrónico';
						const informationPhoneKey = 'Teléfono';
						const informationAddressKey = 'Dirección';
						const informationSocialSecurityNumberKey = 'Número de Seguridad Social';
						const informationAffiliatedMonthsQuantityKey = 'Cantidad de Meses Afiliado';
						const informationQuotesQuantityKey = 'Cantidad de Cotizaciones';
						const informationAffiliatedDateKey = 'Fecha de Afiliación';

						const informationName = nomCliente || 'ABel';
						const informationEmail = email || 'abelbatiista@gmail.com';
						const informationPhone = telefono || '+1 (829) 642-3371';
						const informationAddress = direccion1 || direccion2 || direccion3 || direccion4 || 'Calle San Antonio 5, Los Minas Norte';
						const informationSocialSecurityNumber = '124562332147';
						const informationAffiliatedMonthsQuantity = canMesesAfiliado || '60';
						const informationQuotesQuantity = canCotizaciones || '98';
						const informationAffiliatedDate = !!fecAfiliacion ? formatDate(fecAfiliacion) : '25/09/2015';

						const informationTable = [
							[
								`• ${informationNameKey}: `,
								`• ${informationEmailKey}: `,
								`• ${informationPhoneKey}: `,
								`• ${informationAddressKey}: `,
								`• ${informationSocialSecurityNumberKey}: `,
								`• ${informationAffiliatedMonthsQuantityKey}: `,
								`• ${informationQuotesQuantityKey}: `,
								`• ${informationAffiliatedDateKey}: `,
							],
							[
								`${informationName}`,
								`${informationEmail}`,
								`${informationPhone}`,
								`${informationAddress}`,
								`${informationSocialSecurityNumber}`,
								`${informationAffiliatedMonthsQuantity}`,
								`${informationQuotesQuantity}`,
								`${informationAffiliatedDate}`,
							],
						];

						informationTable.forEach((firstValue, firstIndex, firstArray) => {
							firstValue.forEach((secondValue, secondIndex) => {
								const fontValue = firstIndex === 0 ? evaProSemiboldFont : evaProNormalFont;
								const keyWidth = firstIndex === 0 ? 0 : evaProSemiboldFont.widthOfTextAtSize(firstArray[0][secondIndex], secondFontSize);
								const widthValue = secondIndex <= 3 ? 40 : 260;
								const heightConstant = 160;
								const heighitMultiple = 12;
								const lessIndex = secondIndex > 3 ? secondIndex - 4 : secondIndex;
								const heightValue = firstPageHeight - heightConstant - (heighitMultiple * lessIndex);
								pdfFirstPage.drawText(secondValue, {
									x: widthValue + keyWidth,
									y: heightValue,
									size: secondFontSize,
									font: fontValue,
									color: rgb(0, 0, 0),
									rotate: degrees(0),
								});
							});
						});

						const movementsTitleKey = concepto_00 || 'Movimientos';
						const contributeKey = concepto_01 || 'Lo que Aportas a tu Cuenta RD$';
						const employerContributeKey = concepto_02 || 'Lo que Aporta tu Empleador a tu Cuenta RD$';
						const ordinaryVolunteerContributeKey = concepto_03 || 'Tus Aportes Voluntarios Ordinarios RD$';
						const extraordinaryVolunteerContributeKey = concepto_04 || 'Tus Aportes Voluntarios Extraordinarios RD$';
						const otherReceiveContributeKey = concepto_05 || 'Otros Aportes Recibidos RD$';
						const accountNetReturnKey = concepto_06 || 'Rendimiento Neto de tu Cuenta RD$';
						const expenseKey = concepto_07 || 'Egresos RD$';
						const monthTotalMovementKey = concepto_08 || 'Total Movimientos del Mes RD$';
						const totalAccumulatedKey = concepto_09 || 'Total Acumulado RD$';
						const accumulatedFeeQuantityKey = concepto_010 || 'Cantidad de Cuotas Acumuladas';

						const month1 = mtoMes1_00 || 'Abril';
						const contributeMonth1 = parseToMoney(mtoMes1_01 || Math.random() * 100000);
						const employerContributeMonth1 = parseToMoney(mtoMes1_02 || Math.random() * 100000);
						const ordinaryVolunteerContributeMonth1 = parseToMoney(mtoMes1_03 || Math.random() * 100000);
						const extraordinaryVolunteerContributeMonth1 = parseToMoney(mtoMes1_04 || Math.random() * 100000);
						const otherReceiveContributeMonth1 = parseToMoney(mtoMes1_05 || Math.random() * 100000);
						const accountNetReturnMonth1 = parseToMoney(mtoMes1_06 || Math.random() * 100000);
						const expenseMonth1 = parseToMoney(mtoMes1_07 || Math.random() * 100000);
						const monthTotalMovementMonth1 = parseToMoney(mtoMes1_08 || Math.random() * 100000);
						const totalAccumulatedMonth1 = parseToMoney(mtoMes1_09 || Math.random() * 100000);
						const accumulatedFeeQuantityMonth1 = parseToMoney(mtoMes1_010 || Math.random() * 100000);

						const month2 = mtoMes2_00 || 'Mayo';
						const contributeMonth2 = parseToMoney(mtoMes2_01 || Math.random() * 100000);
						const employerContributeMonth2 = parseToMoney(mtoMes2_02 || Math.random() * 100000);
						const ordinaryVolunteerContributeMonth2 = parseToMoney(mtoMes2_03 || Math.random() * 100000);
						const extraordinaryVolunteerContributeMonth2 = parseToMoney(mtoMes2_04 || Math.random() * 100000);
						const otherReceiveContributeMonth2 = parseToMoney(mtoMes2_05 || Math.random() * 100000);
						const accountNetReturnMonth2 = parseToMoney(mtoMes2_06 || Math.random() * 100000);
						const expenseMonth2 = parseToMoney(mtoMes2_07 || Math.random() * 100000);
						const monthTotalMovementMonth2 = parseToMoney(mtoMes2_08 || Math.random() * 100000);
						const totalAccumulatedMonth2 = parseToMoney(mtoMes2_09 || Math.random() * 100000);
						const accumulatedFeeQuantityMonth2 = parseToMoney(mtoMes2_010 || Math.random() * 100000);

						const month3 = mtoMes3_00 || 'Junio';
						const contributeMonth3 = parseToMoney(mtoMes3_01 || Math.random() * 100000);
						const employerContributeMonth3 = parseToMoney(mtoMes3_02 || Math.random() * 100000);
						const ordinaryVolunteerContributeMonth3 = parseToMoney(mtoMes3_03 || Math.random() * 100000);
						const extraordinaryVolunteerContributeMonth3 = parseToMoney(mtoMes3_04 || Math.random() * 100000);
						const otherReceiveContributeMonth3 = parseToMoney(mtoMes3_05 || Math.random() * 100000);
						const accountNetReturnMonth3 = parseToMoney(mtoMes3_06 || Math.random() * 100000);
						const expenseMonth3 = parseToMoney(mtoMes3_07 || Math.random() * 100000);
						const monthTotalMovementMonth3 = parseToMoney(mtoMes3_08 || Math.random() * 100000);
						const totalAccumulatedMonth3 = parseToMoney(mtoMes3_09 || Math.random() * 100000);
						const accumulatedFeeQuantityMonth3 = parseToMoney(mtoMes3_010 || Math.random() * 100000);

						const month4 = mtoMes4_00 || 'Julio';
						const contributeMonth4 = parseToMoney(mtoMes4_01 || Math.random() * 100000);
						const employerContributeMonth4 = parseToMoney(mtoMes4_02 || Math.random() * 100000);
						const ordinaryVolunteerContributeMonth4 = parseToMoney(mtoMes4_03 || Math.random() * 100000);
						const extraordinaryVolunteerContributeMonth4 = parseToMoney(mtoMes4_04 || Math.random() * 100000);
						const otherReceiveContributeMonth4 = parseToMoney(mtoMes4_05 || Math.random() * 100000);
						const accountNetReturnMonth4 = parseToMoney(mtoMes4_06 || Math.random() * 100000);
						const expenseMonth4 = parseToMoney(mtoMes4_07 || Math.random() * 100000);
						const monthTotalMovementMonth4 = parseToMoney(mtoMes4_08 || Math.random() * 100000);
						const totalAccumulatedMonth4 = parseToMoney(mtoMes4_09 || Math.random() * 100000);
						const accumulatedFeeQuantityMonth4 = parseToMoney(mtoMes4_010 || Math.random() * 100000);

						const month5 = mtoMes5_00 || 'Agosto';
						const contributeMonth5 = parseToMoney(mtoMes5_01 || Math.random() * 100000);
						const employerContributeMonth5 = parseToMoney(mtoMes5_02 || Math.random() * 100000);
						const ordinaryVolunteerContributeMonth5 = parseToMoney(mtoMes5_03 || Math.random() * 100000);
						const extraordinaryVolunteerContributeMonth5 = parseToMoney(mtoMes5_04 || Math.random() * 100000);
						const otherReceiveContributeMonth5 = parseToMoney(mtoMes5_05 || Math.random() * 100000);
						const accountNetReturnMonth5 = parseToMoney(mtoMes5_06 || Math.random() * 100000);
						const expenseMonth5 = parseToMoney(mtoMes5_07 || Math.random() * 100000);
						const monthTotalMovementMonth5 = parseToMoney(mtoMes5_08 || Math.random() * 100000);
						const totalAccumulatedMonth5 = parseToMoney(mtoMes5_09 || Math.random() * 100000);
						const accumulatedFeeQuantityMonth5 = parseToMoney(mtoMes5_010 || Math.random() * 100000);

						const month6 = mtoMes6_00 || 'Septiembre';
						const contributeMonth6 = parseToMoney(mtoMes6_01 || Math.random() * 100000);
						const employerContributeMonth6 = parseToMoney(mtoMes6_02 || Math.random() * 100000);
						const ordinaryVolunteerContributeMonth6 = parseToMoney(mtoMes6_03 || Math.random() * 100000);
						const extraordinaryVolunteerContributeMonth6 = parseToMoney(mtoMes6_04 || Math.random() * 100000);
						const otherReceiveContributeMonth6 = parseToMoney(mtoMes6_05 || Math.random() * 100000);
						const accountNetReturnMonth6 = parseToMoney(mtoMes6_06 || Math.random() * 100000);
						const expenseMonth6 = parseToMoney(mtoMes6_07 || Math.random() * 100000);
						const monthTotalMovementMonth6 = parseToMoney(mtoMes6_08 || Math.random() * 100000);
						const totalAccumulatedMonth6 = parseToMoney(mtoMes6_09 || Math.random() * 100000);
						const accumulatedFeeQuantityMonth6 = parseToMoney(mtoMes6_010 || Math.random() * 100000);

						const movementsTable = [
							[
								movementsTitleKey,
								contributeKey,
								employerContributeKey,
								ordinaryVolunteerContributeKey,
								extraordinaryVolunteerContributeKey,
								otherReceiveContributeKey,
								accountNetReturnKey,
								expenseKey,
								monthTotalMovementKey,
								totalAccumulatedKey,
								accumulatedFeeQuantityKey,
							],
							[
								month1,
								contributeMonth1,
								employerContributeMonth1,
								ordinaryVolunteerContributeMonth1,
								extraordinaryVolunteerContributeMonth1,
								otherReceiveContributeMonth1,
								accountNetReturnMonth1,
								expenseMonth1,
								monthTotalMovementMonth1,
								totalAccumulatedMonth1,
								accumulatedFeeQuantityMonth1,
							],
							[
								month2,
								contributeMonth2,
								employerContributeMonth2,
								ordinaryVolunteerContributeMonth2,
								extraordinaryVolunteerContributeMonth2,
								otherReceiveContributeMonth2,
								accountNetReturnMonth2,
								expenseMonth2,
								monthTotalMovementMonth2,
								totalAccumulatedMonth2,
								accumulatedFeeQuantityMonth2,
							],
							[
								month3,
								contributeMonth3,
								employerContributeMonth3,
								ordinaryVolunteerContributeMonth3,
								extraordinaryVolunteerContributeMonth3,
								otherReceiveContributeMonth3,
								accountNetReturnMonth3,
								expenseMonth3,
								monthTotalMovementMonth3,
								totalAccumulatedMonth3,
								accumulatedFeeQuantityMonth3,
							],
							[
								month4,
								contributeMonth4,
								employerContributeMonth4,
								ordinaryVolunteerContributeMonth4,
								extraordinaryVolunteerContributeMonth4,
								otherReceiveContributeMonth4,
								accountNetReturnMonth4,
								expenseMonth4,
								monthTotalMovementMonth4,
								totalAccumulatedMonth4,
								accumulatedFeeQuantityMonth4,
							],
							[
								month5,
								contributeMonth5,
								employerContributeMonth5,
								ordinaryVolunteerContributeMonth5,
								extraordinaryVolunteerContributeMonth5,
								otherReceiveContributeMonth5,
								accountNetReturnMonth5,
								expenseMonth5,
								monthTotalMovementMonth5,
								totalAccumulatedMonth5,
								accumulatedFeeQuantityMonth5,
							],
							[
								month6,
								contributeMonth6,
								employerContributeMonth6,
								ordinaryVolunteerContributeMonth6,
								extraordinaryVolunteerContributeMonth6,
								otherReceiveContributeMonth6,
								accountNetReturnMonth6,
								expenseMonth6,
								monthTotalMovementMonth6,
								totalAccumulatedMonth6,
								accumulatedFeeQuantityMonth6,
							],
						];

						movementsTable.forEach((firstValue, firstIndex) => {
							firstValue.forEach((secondValue, secondIndex) => {
								const especialTitles = [0, 8, 9, 10];
								const fontValue = especialTitles.includes(secondIndex) ? evaProSemiboldFont : evaProNormalFont;
								const fontWidth = fontValue.widthOfTextAtSize(secondValue, secondFontSize);
								const widthConstant = 40;
								const widthSpecial = 195;
								const lessFirstIndex = firstIndex - 1;
								const widthMultiple = 68;
								const widthRange = firstIndex === 0 ? 0 : (widthSpecial + (widthMultiple * lessFirstIndex) - fontWidth);
								const widthValue = widthConstant + widthRange;
								const heightConstant = 326;
								const heightMultiple = 11.5;
								const heightValue = firstPageHeight - heightConstant - (heightMultiple * secondIndex);
								pdfFirstPage.drawText(secondValue, {
									x: widthValue,
									y: heightValue,
									size: secondFontSize,
									font: fontValue,
									color: rgb(0, 0, 0),
									rotate: degrees(0),
								});
							});
						});

						const periodBalanceKey = concepto_0 || 'SALDO ACUMULADO EN CCI';
						const periodInitialBalanceKey = concepto_1 || 'Saldo Inicial RD$';
						const periodContributionsKey = concepto_2 || 'Aportes RD$';
						const periodExpensesKey = concepto_3 || 'Egresos RD$';
						const periodNetReturnKey = concepto_4 || 'Rendimiento Neto RD$';
						const periodTotalBalanceKey = concepto_5 || 'Total Saldo RD$';

						const periodMonth1 = mtoMesAnio01_0 || 'Jun.2022';
						const periodInitialBalanceMonth1 = parseToMoney(mtoMesAnio01_1 || Math.random() * 100000);
						const periodContributionsMonth1 = parseToMoney(mtoMesAnio01_2 || Math.random() * 100000);
						const periodExpensesMonth1 = parseToMoney(mtoMesAnio01_3 || Math.random() * 100000);
						const periodNetReturnMonth1 = parseToMoney(mtoMesAnio01_4 || Math.random() * 100000);
						const periodTotalBalanceMonth1 = parseToMoney(mtoMesAnio01_5 || Math.random() * 100000);

						const periodMonth2 = mtoMesAnio02_0 || 'Jul.2022';
						const periodInitialBalanceMonth2 = parseToMoney(mtoMesAnio02_1 || Math.random() * 100000);
						const periodContributionsMonth2 = parseToMoney(mtoMesAnio02_2 || Math.random() * 100000);
						const periodExpensesMonth2 = parseToMoney(mtoMesAnio02_3 || Math.random() * 100000);
						const periodNetReturnMonth2 = parseToMoney(mtoMesAnio02_4 || Math.random() * 100000);
						const periodTotalBalanceMonth2 = parseToMoney(mtoMesAnio02_5 || Math.random() * 100000);

						const periodMonth3 = mtoMesAnio03_0 || 'Ago.2022';
						const periodInitialBalanceMonth3 = parseToMoney(mtoMesAnio03_1 || Math.random() * 100000);
						const periodContributionsMonth3 = parseToMoney(mtoMesAnio03_2 || Math.random() * 100000);
						const periodExpensesMonth3 = parseToMoney(mtoMesAnio03_3 || Math.random() * 100000);
						const periodNetReturnMonth3 = parseToMoney(mtoMesAnio03_4 || Math.random() * 100000);
						const periodTotalBalanceMonth3 = parseToMoney(mtoMesAnio03_5 || Math.random() * 100000);

						const periodsTable = [
							[
								periodBalanceKey,
								periodInitialBalanceKey,
								periodContributionsKey,
								periodExpensesKey,
								periodNetReturnKey,
								periodTotalBalanceKey,
							],
							[
								periodMonth1,
								periodInitialBalanceMonth1,
								periodContributionsMonth1,
								periodExpensesMonth1,
								periodNetReturnMonth1,
								periodTotalBalanceMonth1,
							],
							[
								periodMonth2,
								periodInitialBalanceMonth2,
								periodContributionsMonth2,
								periodExpensesMonth2,
								periodNetReturnMonth2,
								periodTotalBalanceMonth2,
							],
							[
								periodMonth3,
								periodInitialBalanceMonth3,
								periodContributionsMonth3,
								periodExpensesMonth3,
								periodNetReturnMonth3,
								periodTotalBalanceMonth3,
							],
						];

						periodsTable.forEach((firstValue, firstIndex) => {
							firstValue.forEach((secondValue, secondIndex) => {
								const especialTitles = [0, 5,];
								const fontValue = especialTitles.includes(secondIndex) ? evaProSemiboldFont : evaProNormalFont;
								const fontWidth = fontValue.widthOfTextAtSize(secondValue, secondFontSize);
								const widthConstant = 45;
								const widthSpecial = 170;
								const lessFirstIndex = firstIndex - 1;
								const widthMultiple = 52;
								const widthRange = firstIndex === 0 ? 0 : (widthSpecial + (widthMultiple * lessFirstIndex) - fontWidth);
								const widthValue = widthConstant + widthRange;
								const heightConstant = 463;
								const heightMultiple = 16;
								const heightValue = firstPageHeight - heightConstant - (heightMultiple * secondIndex);
								pdfFirstPage.drawText(secondValue, {
									x: widthValue,
									y: heightValue,
									size: secondFontSize,
									font: fontValue,
									color: rgb(0, 0, 0),
									rotate: degrees(0),
								});
							});
						});

						const commissionCollectedAnnual = `Comisión Anual Sobre Saldo Administrado (${pctComisComp || 1.05}%)*`;
						const commissionCollectedAnnualPrice = parseToMoney(totalComisiones || Math.random() * 100000);

						const commissionTable = [
							commissionCollectedAnnual,
							commissionCollectedAnnualPrice,
						];

						commissionTable.forEach((value, index) => {
							const widthConstant = 45;
							const widthSpecial = 265;
							const widthRange = index === 0 ? 0 : widthSpecial;
							const widthValue = widthConstant + widthRange;
							const heightConstant = 595;
							const heightValue = firstPageHeight - heightConstant;
							pdfFirstPage.drawText(value, {
								x: widthValue,
								y: heightValue,
								size: secondFontSize,
								font: evaProNormalFont,
								color: rgb(0, 0, 0),
								rotate: degrees(0),
							});
						});

						const textWarn1 = '*Si aplica, incluye comisión anual complementaria y comisión por administración AFP';
						const textWarn2 = 'para períodos antes de la entrada en vigencia de la Ley 13-20.';

						const textsWarnTable = [
							textWarn1,
							textWarn2,
						];

						textsWarnTable.forEach((value, index) => {
							const widthConstant = 45;
							const widthValue = widthConstant;
							const heightConstant = 610;
							const heightRange = index === 0 ? 0 : 7;
							const heightValue = firstPageHeight - heightConstant - heightRange;
							pdfFirstPage.drawText(value, {
								x: widthValue,
								y: heightValue,
								size: fourthFontSize,
								font: evaProNormalFont,
								color: rgb(0, 0, 0),
								rotate: degrees(0),
							});
						});

						const actualDate = formatStringToDate(fecDesde);
						const previousDate = new Date(actualDate.setFullYear(actualDate.getFullYear() - 1));
						const effectivenessPreviousPeriodKey = `Valor Cuota Período Anterior (${formatDate(previousDate) || '30/09/2022'})`;
						const effectivenessActualPeriodKey = `Valor Cuota Período Actual (${fecDesde || '30/09/2023'})`;
						const effectivenessAnnualNominalKey = 'Rentabilidad Nominal Actualizada';
						
						const effectivenessPreviousPeriod = parseToMoney(valorCuotaIniRentab || Math.random() * 100000);
						const effectivenessActualPeriod = parseToMoney(valorCuota || Math.random() * 100000);
						const effectivenessAnnualNominal = `${pctRentAnual || '12.65'}%`;

						const effectivenessTable = [
							[
								effectivenessPreviousPeriodKey,
								effectivenessActualPeriodKey,
								effectivenessAnnualNominalKey,
							],
							[
								effectivenessPreviousPeriod,
								effectivenessActualPeriod,
								effectivenessAnnualNominal,
							],
						];

						effectivenessTable.forEach((firstValue, firstIndex) => {
							firstValue.forEach((secondValue, secondIndex) => {
								const especialTitles = [2];
								const fontValue = especialTitles.includes(secondIndex) ? evaProSemiboldFont : evaProNormalFont;
								const fontWidth = fontValue.widthOfTextAtSize(secondValue, secondFontSize);
								const widthConstant = 45;
								const widthSpecial = 283;
								const widthRange = firstIndex === 0 ? 0 : (widthSpecial - fontWidth);
								const widthValue = widthConstant + widthRange;
								const heightConstant = 668;
								const heightMultiple = 11;
								const heightValue = firstPageHeight - heightConstant - (heightMultiple * secondIndex);
								pdfFirstPage.drawText(secondValue, {
									x: widthValue,
									y: heightValue,
									size: secondFontSize,
									font: fontValue,
									color: rgb(0, 0, 0),
									rotate: degrees(0),
								});
							});
						});

						const textFooterTitle1 = 'Santo Domingo:';
						const textFooterTitle2 = 'Santiago:';

						const textFooterDescription1 = `C/ Virgilio Díaz Ordoñez #36, Esq. Gustavo Mejía Ricart, Edif. Mezzo-Tempo, Primer Piso, Ens. Evaristo Morales, RNC: 101-784326 • Teléfono: 809-567-2371.`;
						const textFooterDescription2 = `Ave. 27 de Febrero #51, Plaza Mía, Primer Nivel, Local 1-06B • Teléfono: (809) 276-5659`;

						const textsFooterTable = [
							[
								textFooterTitle1,
								textFooterTitle2,
							],
							[
								textFooterDescription1,
								textFooterDescription2,
							],
						];

						textsFooterTable.forEach((firstValue, firstIndex, firstArray) => {
							firstValue.forEach((secondValue, secondIndex) => {
								const fontColor = firstIndex === 0 ? rgb(0 / 255, 94 / 255, 184 / 255) : rgb(0, 0, 0);
								const fontValue = firstIndex === 0 ? evaProSemiboldFont : evaProNormalFont;
								const widthConstant = secondIndex === 0 ? 65 : 171;
								const fontWidth = fontValue.widthOfTextAtSize(firstArray[0][secondIndex], thirdFontSize);
								const witdhRange = firstIndex === 0 ? 0 : fontWidth + 5;
								const widthValue = widthConstant + witdhRange;
								const heightConstant = 760;
								const heightMultiple = 9;
								const heightValue = firstPageHeight - heightConstant - (heightMultiple * secondIndex);
								pdfFirstPage.drawText(secondValue, {
									x: widthValue,
									y: heightValue,
									size: thirdFontSize,
									font: fontValue,
									color: fontColor,
									rotate: degrees(0),
								});
							});
						});

						const textAccountDataDetail = 'Conoce detalladamente tu estado de cuenta, haz clic aquí para visualizar el instructivo';
						const textAccountDataDetailWidthSize = evaProSemiboldFont.widthOfTextAtSize(textAccountDataDetail, thirdFontSize);
						const textAccountDataDetailHeightSize = evaProSemiboldFont.heightAtSize(thirdFontSize);
						const textAccountDataDetailWidth = (firstPageWidth - textAccountDataDetailWidthSize) / 2;
						const textAccountDataDetailHeight = firstPageHeight - 778;
						pdfFirstPage.drawText(textAccountDataDetail, {
							x: textAccountDataDetailWidth,
							y: textAccountDataDetailHeight,
							size: thirdFontSize,
							font: evaProSemiboldFont,
							color: rgb(0 / 255, 94 / 255, 184 / 255),
							rotate: degrees(0),
						});

						const textAccountDataDetailLineWidth = textAccountDataDetailWidth;
						const textAccountDataDetailLineHeight = textAccountDataDetailHeight - 1;
						pdfFirstPage.drawLine({
							start: {
								x: textAccountDataDetailLineWidth,
								y: textAccountDataDetailLineHeight,
							},
							end: {
								x: textAccountDataDetailLineWidth + textAccountDataDetailWidthSize,
								y: textAccountDataDetailLineHeight,
							},
							thickness: 0.5,
							color: rgb(0 / 255, 94 / 255, 184 / 255),
							opacity: 1,
						});

						const accountDetailUrl = 'https://www.afpsiembra.com/images_mk/edc/instructivo_estcta_2018.gif';
						const accountDetailAnnotations = pdfFirstPage.node.Annots();
						const accountDetailHyperlink = filePdf.context.obj({
							Type: 'Annot',
							Subtype: 'Link',
							Rect: [
								textAccountDataDetailWidth,
								textAccountDataDetailHeight,
								textAccountDataDetailLineWidth + textAccountDataDetailWidthSize,
								textAccountDataDetailHeight + (textAccountDataDetailHeightSize / 2),
							],
							Border: [0, 0, 0,],
							A: {
								Type: 'Action',
								S: 'URI',
								URI: accountDetailUrl,
							},
						});
						accountDetailAnnotations.push(accountDetailHyperlink);

						pdfFirstPage.drawImage(edcHistoricImageBufferPngPdf, {
							x: 360,
							y: 220,
							width: 220,
							height: 90,
						});

						pdfFirstPage.drawImage(edcCurrencyImageBufferPngPdf, {
							x: 360,
							y: 100,
							width: 220,
							height: 90,
						});

						pdfFirstPage.drawImage(edcElementsFooterImageBufferPngPdf, {
							x: 40,
							y: 40,
							width: 532,
							height: 40,
						});

						const pdfBytes = await filePdf.save();
						const pdfBuffer = Buffer.from(pdfBytes);

						if (fileStreamModule.existsSync(fileFilledPath)) {
							fileStreamModule.unlinkSync(fileFilledPath);
						}

						fileStreamModule.writeFileSync(fileFilledPath, pdfBytes);

						switch (format) {
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
									if (!!error)
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
						console.error(error);
						const { message: errorMessage } = error;
						badRequest(response, errorMessage);
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