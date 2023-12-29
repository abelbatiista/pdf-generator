const httpModule = require('http');
const fileStreamModule = require('fs');
const pathModule = require('path');
const urlModule = require('url');
const pdfModule = require('pdf-lib');
const { degrees, PDFDocument, rgb, StandardFonts } = pdfModule;
const axiosModule = require('axios');
const uuidModule = require('uuid');
const { v4: uuidv4 } = uuidModule;

const parseToMoney = (value) => {
	return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseToCurrency = (value) => {
	return `RD$ ${parseToMoney(value)}`;
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

const getEdcData = async (accountCode = '1000', period = '122014', batchNumber = '64') => {
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

const getEdcPeriods = async (userDni = '01600089864') => {
	const route = 'get-periodos';
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
							userDni,
						} = JSON.parse(bodyString);

						// const edcDataResponse = await getEdcData(accountCode, period, batchNumber);
						// const edcObjectData = edcDataResponse.data;
						// if(!edcObjectData || !edcObjectData.payload || !edcObjectData.payload.data) {
						//     badRequest(response, 'API AFP Siembra Failed');
						//     return;
						// }
						// const { payload: {
						//     data: edcData,
						// } } = edcObjectData;

						// const edcPeriodsResponse = await getEdcPeriods(userDni);
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
						if (!!urlQueryParams && urlQueryParams['response-format'])
							format = urlQueryParams['response-format'];

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

						const helveticaBoldFont = await filePdf.embedFont(StandardFonts.HelveticaBold);
						const helveticaFont = await filePdf.embedFont(StandardFonts.Helvetica);

						const pdfPages = filePdf.getPages();
						const pdfFirstPage = pdfPages[0];
						const { width: firstPageWidth, height: firstPageHeight } = pdfFirstPage.getSize();

						const firstFontSize = 8;
						const secondFontSize = 7;
						const thirdFontSize = 6;
						const fourthFontSize = 5;

						const initialAmountParsed = parseToCurrency(Math.random() * 50000);
						const initialAmountSize = helveticaBoldFont.widthOfTextAtSize(initialAmountParsed, firstFontSize);
						pdfFirstPage.drawText(initialAmountParsed, {
							x: firstPageWidth - 480 - initialAmountSize,
							y: firstPageHeight - 283,
							size: firstFontSize,
							font: helveticaBoldFont,
							color: rgb(0, 0, 0),
							rotate: degrees(0),
						});

						const periodAmountParsed = parseToCurrency(Math.random() * 10000);
						const periodAmountSize = helveticaBoldFont.widthOfTextAtSize(periodAmountParsed, firstFontSize);
						pdfFirstPage.drawText(periodAmountParsed, {
							x: firstPageWidth - 372 - periodAmountSize,
							y: firstPageHeight - 283,
							size: firstFontSize,
							font: helveticaBoldFont,
							color: rgb(0, 0, 0),
							rotate: degrees(0),
						});

						const periodPerformanceAmountParsed = parseToCurrency(Math.random() * 1000);
						const periodPerformanceAmountSize = helveticaBoldFont.widthOfTextAtSize(periodPerformanceAmountParsed, firstFontSize);
						pdfFirstPage.drawText(periodPerformanceAmountParsed, {
							x: firstPageWidth - 264 - periodPerformanceAmountSize,
							y: firstPageHeight - 283,
							size: firstFontSize,
							font: helveticaBoldFont,
							color: rgb(0, 0, 0),
							rotate: degrees(0),
						});

						const expensesParsed = parseToCurrency(Math.random() * 10000);
						const expensesSize = helveticaBoldFont.widthOfTextAtSize(expensesParsed, firstFontSize);
						pdfFirstPage.drawText(expensesParsed, {
							x: firstPageWidth - 156 - expensesSize,
							y: firstPageHeight - 283,
							size: firstFontSize,
							font: helveticaBoldFont,
							color: rgb(0, 0, 0),
							rotate: degrees(0),
						});

						const individualAmountParsed = parseToCurrency(Math.random() * 1000000);
						const individualAmountSize = helveticaBoldFont.widthOfTextAtSize(individualAmountParsed, firstFontSize);
						pdfFirstPage.drawText(individualAmountParsed, {
							x: firstPageWidth - 48 - individualAmountSize,
							y: firstPageHeight - 283,
							size: firstFontSize,
							font: helveticaBoldFont,
							color: rgb(0, 0, 0),
							rotate: degrees(0),

						});

						const textCutOff1 = 'Al corte del 01 de';
						const textCutOff2 = 'Abril de 2023';

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
								font: helveticaFont,
								color: rgb(1, 1, 1),
								rotate: degrees(0),
							});
						});

						const nameKey = 'Nombre';
						const emailKey = 'Correo Electrónico';
						const phoneKey = 'Teléfono';
						const addressKey = 'Dirección';
						const socialSecurityNumberKey = 'Número de Seguridad Social';
						const affiliatedMonthsQuantityKey = 'Cantidad de Meses Afiliado';
						const quotesQuantityKey = 'Cantidad de Cotizaciones';
						const affiliatedDateKey = 'Fecha de Afiliación';

						const name = 'ABel';
						const email = 'abelbatiista@gmail.com';
						const phone = '+1 (829) 642-3371';
						const address = 'Calle San Antonio 5, Los Minas Norte';
						const socialSecurityNumber = '124562332147';
						const affiliatedMonthsQuantity = '60';
						const quotesQuantity = '98';
						const affiliatedDate = '25/09/2015';

						const firstTable = [
							[
								`• ${nameKey}: `,
								`• ${emailKey}: `,
								`• ${phoneKey}: `,
								`• ${addressKey}: `,
								`• ${socialSecurityNumberKey}: `,
								`• ${affiliatedMonthsQuantityKey}: `,
								`• ${quotesQuantityKey}: `,
								`• ${affiliatedDateKey}: `,
							],
							[
								`${name}`,
								`${email}`,
								`${phone}`,
								`${address}`,
								`${socialSecurityNumber}`,
								`${affiliatedMonthsQuantity}`,
								`${quotesQuantity}`,
								`${affiliatedDate}`,
							],
						];

						const headerKey = 'Período';
						const headerStartDate = '01/06/2023';
						const headerEndDate = '30/09/2023';
						const headerTitle = `${headerKey}: ${headerStartDate} - ${headerEndDate}`;

						pdfFirstPage.drawText(headerTitle, {
							x: 40,
							y: firstPageHeight - 140,
							size: firstFontSize,
							font: helveticaBoldFont,
							color: rgb(0, 0, 0),
							rotate: degrees(0),
						});

						firstTable.forEach((firstValue, firstIndex, firstArray) => {
							firstValue.forEach((secondValue, secondIndex) => {
								const fontValue = firstIndex === 0 ? helveticaBoldFont : helveticaFont;
								const keyWidth = firstIndex === 0 ? 0 : helveticaBoldFont.widthOfTextAtSize(firstArray[0][secondIndex], secondFontSize);
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

						const movementsKey = 'Movimientos';
						const contributeKey = 'Lo que Aportas a tu Cuenta RD$';
						const employerContributeKey = 'Lo que Aporta tu Empleador a tu Cuenta RD$';
						const ordinaryVolunteerContributeKey = 'Tus Aportes Voluntarios Ordinarios RD$';
						const extraordinaryVolunteerContributeKey = 'Tus Aportes Voluntarios Extraordinarios RD$';
						const otherReceiveContributeKey = 'Otros Aportes Recibidos RD$';
						const accountNetReturnKey = 'Rendimiento Neto de tu Cuenta RD$';
						const expenseKey = 'Egresos RD$';
						const monthTotalMovementKey = 'Total Movimientos del Mes RD$';
						const totalAccumulatedKey = 'Total Acumulado RD$';
						const accumulatedFeeQuantityKey = 'Cantidad de Cuotas Acumuladas';

						const month1 = 'Abril';
						const contributeMonth1 = parseToMoney(Math.random() * 100000);
						const employerContributeMonth1 = parseToMoney(Math.random() * 100000);
						const ordinaryVolunteerContributeMonth1 = parseToMoney(Math.random() * 100000);
						const extraordinaryVolunteerContributeMonth1 = parseToMoney(Math.random() * 100000);
						const otherReceiveContributeMonth1 = parseToMoney(Math.random() * 100000);
						const accountNetReturnMonth1 = parseToMoney(Math.random() * 100000);
						const expenseMonth1 = parseToMoney(Math.random() * 100000);
						const monthTotalMovementMonth1 = parseToMoney(Math.random() * 100000);
						const totalAccumulatedMonth1 = parseToMoney(Math.random() * 100000);
						const accumulatedFeeQuantityMonth1 = parseToMoney(Math.random() * 100000);

						const month2 = 'Mayo';
						const contributeMonth2 = parseToMoney(Math.random() * 100000);
						const employerContributeMonth2 = parseToMoney(Math.random() * 100000);
						const ordinaryVolunteerContributeMonth2 = parseToMoney(Math.random() * 100000);
						const extraordinaryVolunteerContributeMonth2 = parseToMoney(Math.random() * 100000);
						const otherReceiveContributeMonth2 = parseToMoney(Math.random() * 100000);
						const accountNetReturnMonth2 = parseToMoney(Math.random() * 100000);
						const expenseMonth2 = parseToMoney(Math.random() * 100000);
						const monthTotalMovementMonth2 = parseToMoney(Math.random() * 100000);
						const totalAccumulatedMonth2 = parseToMoney(Math.random() * 100000);
						const accumulatedFeeQuantityMonth2 = parseToMoney(Math.random() * 100000);

						const month3 = 'Junio';
						const contributeMonth3 = parseToMoney(Math.random() * 100000);
						const employerContributeMonth3 = parseToMoney(Math.random() * 100000);
						const ordinaryVolunteerContributeMonth3 = parseToMoney(Math.random() * 100000);
						const extraordinaryVolunteerContributeMonth3 = parseToMoney(Math.random() * 100000);
						const otherReceiveContributeMonth3 = parseToMoney(Math.random() * 100000);
						const accountNetReturnMonth3 = parseToMoney(Math.random() * 100000);
						const expenseMonth3 = parseToMoney(Math.random() * 100000);
						const monthTotalMovementMonth3 = parseToMoney(Math.random() * 100000);
						const totalAccumulatedMonth3 = parseToMoney(Math.random() * 100000);
						const accumulatedFeeQuantityMonth3 = parseToMoney(Math.random() * 100000);

						const month4 = 'Julio';
						const contributeMonth4 = parseToMoney(Math.random() * 100000);
						const employerContributeMonth4 = parseToMoney(Math.random() * 100000);
						const ordinaryVolunteerContributeMonth4 = parseToMoney(Math.random() * 100000);
						const extraordinaryVolunteerContributeMonth4 = parseToMoney(Math.random() * 100000);
						const otherReceiveContributeMonth4 = parseToMoney(Math.random() * 100000);
						const accountNetReturnMonth4 = parseToMoney(Math.random() * 100000);
						const expenseMonth4 = parseToMoney(Math.random() * 100000);
						const monthTotalMovementMonth4 = parseToMoney(Math.random() * 100000);
						const totalAccumulatedMonth4 = parseToMoney(Math.random() * 100000);
						const accumulatedFeeQuantityMonth4 = parseToMoney(Math.random() * 100000);

						const month5 = 'Agosto';
						const contributeMonth5 = parseToMoney(Math.random() * 100000);
						const employerContributeMonth5 = parseToMoney(Math.random() * 100000);
						const ordinaryVolunteerContributeMonth5 = parseToMoney(Math.random() * 100000);
						const extraordinaryVolunteerContributeMonth5 = parseToMoney(Math.random() * 100000);
						const otherReceiveContributeMonth5 = parseToMoney(Math.random() * 100000);
						const accountNetReturnMonth5 = parseToMoney(Math.random() * 100000);
						const expenseMonth5 = parseToMoney(Math.random() * 100000);
						const monthTotalMovementMonth5 = parseToMoney(Math.random() * 100000);
						const totalAccumulatedMonth5 = parseToMoney(Math.random() * 100000);
						const accumulatedFeeQuantityMonth5 = parseToMoney(Math.random() * 100000);

						const month6 = 'Septiembre';
						const contributeMonth6 = parseToMoney(Math.random() * 100000);
						const employerContributeMonth6 = parseToMoney(Math.random() * 100000);
						const ordinaryVolunteerContributeMonth6 = parseToMoney(Math.random() * 100000);
						const extraordinaryVolunteerContributeMonth6 = parseToMoney(Math.random() * 100000);
						const otherReceiveContributeMonth6 = parseToMoney(Math.random() * 100000);
						const accountNetReturnMonth6 = parseToMoney(Math.random() * 100000);
						const expenseMonth6 = parseToMoney(Math.random() * 100000);
						const monthTotalMovementMonth6 = parseToMoney(Math.random() * 100000);
						const totalAccumulatedMonth6 = parseToMoney(Math.random() * 100000);
						const accumulatedFeeQuantityMonth6 = parseToMoney(Math.random() * 100000);

						const secondTable = [
							[
								movementsKey,
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

						secondTable.forEach((firstValue, firstIndex) => {
							firstValue.forEach((secondValue, secondIndex) => {
								const especialTitles = [0, 8, 9, 10];
								const fontValue = especialTitles.includes(secondIndex) ? helveticaBoldFont : helveticaFont;
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

						const periodBalanceKey = 'SALDO ACUMULADO EN CCI';
						const periodInitialBalanceKey = 'Saldo Inicial RD$';
						const periodContributionsKey = 'Aportes RD$';
						const periodExpensesKey = 'Egresos RD$';
						const periodNetReturnKey = 'Rendimiento Neto RD$';
						const periodTotalBalanceKey = 'Total Saldo RD$';

						const periodMonth1 = 'Jun.2022';
						const periodInitialBalanceMonth1 = parseToMoney(Math.random() * 100000);
						const periodContributionsMonth1 = parseToMoney(Math.random() * 100000);
						const periodExpensesMonth1 = parseToMoney(Math.random() * 100000);
						const periodNetReturnMonth1 = parseToMoney(Math.random() * 100000);
						const periodTotalBalanceMonth1 = parseToMoney(Math.random() * 100000);

						const periodMonth2 = 'Jul.2022';
						const periodInitialBalanceMonth2 = parseToMoney(Math.random() * 100000);
						const periodContributionsMonth2 = parseToMoney(Math.random() * 100000);
						const periodExpensesMonth2 = parseToMoney(Math.random() * 100000);
						const periodNetReturnMonth2 = parseToMoney(Math.random() * 100000);
						const periodTotalBalanceMonth2 = parseToMoney(Math.random() * 100000);

						const periodMonth3 = 'Ago.2022';
						const periodInitialBalanceMonth3 = parseToMoney(Math.random() * 100000);
						const periodContributionsMonth3 = parseToMoney(Math.random() * 100000);
						const periodExpensesMonth3 = parseToMoney(Math.random() * 100000);
						const periodNetReturnMonth3 = parseToMoney(Math.random() * 100000);
						const periodTotalBalanceMonth3 = parseToMoney(Math.random() * 100000);

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
								const fontValue = especialTitles.includes(secondIndex) ? helveticaBoldFont : helveticaFont;
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

						const commissionCollectedAnnual = 'Comisión Anual Sobre Saldo Administrado (1.05%)*';
						const commissionCollectedAnnualPrice = parseToMoney(Math.random() * 100000);

						const commissionTable = [
							commissionCollectedAnnual,
							commissionCollectedAnnualPrice,
						];

						commissionTable.forEach((value, index) => {
							const widthConstant = 45;
							const widthSpecial = 250;
							const widthRange = index === 0 ? 0 : widthSpecial;
							const widthValue = widthConstant + widthRange;
							const heightConstant = 595;
							const heightValue = firstPageHeight - heightConstant;
							pdfFirstPage.drawText(value, {
								x: widthValue,
								y: heightValue,
								size: secondFontSize,
								font: helveticaFont,
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
								font: helveticaFont,
								color: rgb(0, 0, 0),
								rotate: degrees(0),
							});
						});

						const effectivenessPreviousPeriodKey = 'Valor Cuota Período Anterior (30/09/2022)';
						const effectivenessActualPeriodKey = 'Valor Cuota Período Actual (30/09/2023)';
						const effectivenessAnnualNominalKey = 'Rentabilidad Nominal Actualizada';

						const effectivenessPreviousPeriod = parseToMoney(Math.random() * 100000);
						const effectivenessActualPeriod = parseToMoney(Math.random() * 100000);
						const effectivenessAnnualNominal = '12.65%';

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
								const fontValue = especialTitles.includes(secondIndex) ? helveticaBoldFont : helveticaFont;
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
								const fontValue = firstIndex === 0 ? helveticaBoldFont : helveticaFont;
								const widthConstant = secondIndex === 0 ? 65 : 171;
								const fontWidth = fontValue.widthOfTextAtSize(firstArray[0][secondIndex], thirdFontSize);
								const witdhRange = firstIndex === 0 ? 0 : fontWidth + 5;
								const widthValue = widthConstant + witdhRange;
								const heightConstant = 760;
								const heightMultiple = 7;
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
						const textAccountDataDetailWidthSize = helveticaBoldFont.widthOfTextAtSize(textAccountDataDetail, thirdFontSize);
						const textAccountDataDetailHeightSize = helveticaBoldFont.heightAtSize(thirdFontSize);
						const textAccountDataDetailWidth = (firstPageWidth - textAccountDataDetailWidthSize) / 2;
						const textAccountDataDetailHeight = firstPageHeight - 774;
						pdfFirstPage.drawText(textAccountDataDetail, {
							x: textAccountDataDetailWidth,
							y: textAccountDataDetailHeight,
							size: thirdFontSize,
							font: helveticaBoldFont,
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