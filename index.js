
/**
 *  Обьект полезными функциями. Была бы сборка,
 *  такой обьект был вынесен в отдельный файл и
 *  харнил все полезные статические функции для 
 *  разных классов приложения.
 */
const utils = {
	makeRequest: (method, URL, body = null) => {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();

			xhr.open(method, URL, true);
			xhr.send(body);

			xhr.onreadystatechange = function() {
				if (this.readyState != 4) return;

				if (xhr.status != 200) {
					reject({ status: xhr.status, text: xhr.statusText });
				} else {
					resolve(xhr.responseText);
				}
			};
		});
	}
};

/**
 * Исходный класс работы с формой
 */
class CustomForm {

/**
 * Интерфейс для конфигурационного обьекта
 * @typedef {Object} Configuration
 * @property {Object} formElement - Обьект элемента формы
 * @property {string[]} trackedInputs - Отслеживаемые поля (имя поля) для занесения данных
 * @property {Object} submitButton - Обьект кнопки для отправки формы.
 * @property {Object} resultContainer - Обьект элемента для рендеринга результата ответа от сервера.
 */

/**
  * Интерфейс обьекта валидации формы
  * @typedef {Object} ValidateObject
  */



	/**
     * Конструктор класса. 
     * Инициализирует переменные и настройки всего класса.
     * Например обьект стратегии валидации инпута.
     * Запускает функцию инициализации обработциков события 
     * 
     * @param {Configuration} config 
     */
	constructor(config) {
		const { formElement, submitButton, trackedInputs, resultContainer } = config;

		this.form = formElement;
		this.trackedInputs = trackedInputs;
		this.submitButton = submitButton;
		this.resultContainer = resultContainer;

		this.validateStrategy = {
			fio: value => {
				const trimString = value.replace(/\s+/g, ' ').trim();

				return trimString.split(' ').length === 3;
			},

			email: value => {
				const correctDomens = [
					'ya.ru',
					'yandex.ru',
					'yandex.ua',
					'yandex.by',
					'yandex.kz',
					'yandex.com'
				];
				const [emailBody, emailDomen] = value.split('@');

				return correctDomens.includes(emailDomen) && emailBody;
			},

			phone: value => {
				const regPattert = /^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$/;
				const maskCondition = regPattert.test(value);

				const telNumbers = value.replace(/\D+/g, '').split('');
				const sumTel = telNumbers.reduce((sum, number) => {
					sum += +number;
					return sum;
				}, 0);

				return maskCondition && sumTel <= 30;
			}
		};

		this.addEventListeners();
	}

	/**
     * Инициализация обработчиков событий
     */
	addEventListeners() {
		this.submitButton.addEventListener('click', e => {
			e.preventDefault();
			this.submit();
		});
	}

    /**
     * 
     * @param {*} param0 
     */
	highlightErrorFields({ errorFields }) {
		errorFields.forEach(errorField => {
			this.form.elements[errorField].classList.add('error');
		});
	}

	resetHighlights() {
		const elements = Array.from(this.form.elements);

		elements.forEach(element => {
			if (element.name) {
				element.classList.remove('error');
			}
		});
	}

	changeInputsUI(validateData) {
		this.resetHighlights();

		if (!validateData.isValid) {
			this.highlightErrorFields(validateData);
		}
	}

	changeUIBySuccess() {

		this.resultContainer.classList.add('success');
		this.resultContainer.innerHTML = 'Success';

		this.setDisabledButton(false);
	}

	changeUIByError(res) {

		this.resultContainer.classList.add('error');
		this.resultContainer.innerHTML = res.reason;

		this.setDisabledButton(false);
	}

	changeUIByProgress() {
		this.resultContainer.classList.add('progress');
	}

	setDisabledButton(state) {
		this.submitButton.disabled = state;
	}

	resetUIContainer() {
		this.resultContainer.classList.remove('success');
		this.resultContainer.classList.remove('error');
		this.resultContainer.classList.remove('progress');

		this.resultContainer.innerHTML = '';
	}

	repeatRequest(res) {

		this.changeUIByProgress();
		setTimeout(this.submit.bind(this), res.timeout);
	}

	makeRequest() {
		const URL = this.form.action;
		const method = this.form.method;

		return utils.makeRequest(method, URL);
	}

	pickAction(responce) {
		const resObject = JSON.parse(responce);
		const strategy = {
			success: this.changeUIBySuccess,
			error: this.changeUIByError,
			progress: this.repeatRequest
		};

		this.resetUIContainer();
		strategy[resObject.status].apply(this, [resObject]);
	}

	validate() {
		const elements = Array.from(this.form.elements);

		const validateData = elements.reduce(
			(validateData, input) => {
				const name = input.name;
				const currentStrategy = this.validateStrategy[name];

				if (!currentStrategy) return validateData;

				if (!currentStrategy(input.value)) {
					validateData.isValid = false;
					validateData.errorFields.push(name);
				}

				return validateData;
			},
			{ isValid: true, errorFields: [] }
		);

		this.changeInputsUI(validateData);

		return validateData;
	}

	getData() {
		const elements = Array.from(this.form.elements);

		return elements.reduce((formData, element) => {
			const name = element.name;

			if (name) {
				formData[name] = element.value;
			}

			return formData;
		}, {});
	}

	setData(data) {
		this.trackedInputs.forEach(name => {
			if (data.hasOwnProperty(name)) {
				this.form.elements[name].value = data[name];
			}
		});
	}

	submit() {

		const formValidate = this.validate();

		if (formValidate.isValid) {
			this.setDisabledButton(true);
			this.makeRequest().then(this.pickAction.bind(this)).catch();
		} else {
			this.setDisabledButton(false);
		}
	}
}

const form = new CustomForm({
	formElement: document.querySelector('#myForm'),
	submitButton: document.querySelector('#submitButton'),
	trackedInputs: ['fio', 'phone', 'email'],
	resultContainer: document.querySelector('#resultContainer')
});

form.setData({
	fio: 'Куликов Владимир Алексеевич',
	email: 'vovakuliov@ya.ru',
	phone: '+7(111)222-33-11'
});
