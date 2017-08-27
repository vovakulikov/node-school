
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
	 * Устанавливет классы для полей не прошедших валидацию
     * 
     * @param {ValidateObject} - Обьект с результатами валидации формы
     */
	highlightErrorFields({ errorFields }) {
		errorFields.forEach(errorField => {
			this.form.elements[errorField].classList.add('error');
		});
	}

	/**
	 * Cбрасывает классы у полей
	 */
	resetHighlights() {
		const elements = Array.from(this.form.elements);

		elements.forEach(element => {
			if (element.name) {
				element.classList.remove('error');
			}
		});
	}

	/**
	 * Функция установки UI полей в корректное состояние 
	 * Сбросить все состояния для всех полей.
	 * Установить класы тем, полям, которые не прошли валидацию
	 * 
	 * @param {ValidateObject} - Обьект с результатами валидации формы
	 */
	changeInputsUI(validateData) {
		this.resetHighlights();

		if (!validateData.isValid) {
			this.highlightErrorFields(validateData);
		}
	}


	/**
	 * Метод установки контейнеру для результата
	 * нужного состояния UI при положительном ответе сервера.
	 */
	changeUIBySuccess() {
		this.resultContainer.classList.add('success');
		this.resultContainer.innerHTML = 'Success';

		this.setDisabledButton(false);
	}

	/**
	 * Метод установки контейнеру для результата
	 * нужного состояния UI при отрицательном ответе сервера.
	 * @param {Object} - Обьект ответа от сервера 
	 */
	changeUIByError(res) {
		this.resultContainer.classList.add('error');
		this.resultContainer.innerHTML = res.reason;

		this.setDisabledButton(false);
	}

	/**
	 * Метод установки контейнеру для результата
	 * нужного состояния UI при прогресс-состоянии сервера.
	 * @param {Object} - Обьект ответа от сервера 
	 */
	changeUIByProgress() {
		this.resultContainer.classList.add('progress');
	}

	/**
	 * Установить кнопку с сотояние disabled 
	 * в зависимости от параметра state
	 * 
	 * @param {boolean} state - состояние свойства disabled
	 */
	setDisabledButton(state) {
		this.submitButton.disabled = state;
	}

	/**
	 *  Метод сброс стилей у коннейнера ответа от сервера.
	 */
	resetUIContainer() {
		this.resultContainer.classList.remove('success');
		this.resultContainer.classList.remove('error');
		this.resultContainer.classList.remove('progress');

		this.resultContainer.innerHTML = '';
	}

	/**
	 * Функция, повтора логики отправки формы.
	 * 
	 * @param {Object} res 
	 */
	repeatRequest(res) {
		this.changeUIByProgress();
		setTimeout(this.submit.bind(this), res.timeout);
	}

	/**
	 * Метод запроса к серверу по URL указанном в атрибуте action формы
	 * @returns {Promise}
	 */
	makeRequest() {
		const URL = this.form.action;
		const method = this.form.method;

		return utils.makeRequest(method, URL);
	}

	/**
	 * Выбирает раекцию ответа программы 
	 * в зависимости от типа ответа сервера
	 * 
	 * @param {Object} responce 
	 */
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

	/**
  	* Интерфейс обьекта валидации формы
	* @typedef {Object} ValidateObject
	* @property {boolean} isValid - признак валидации
	* @property {string[]} errorFields - Имена инпутов не прошедших валидацию
	*/

	/**
	 * Метод валидации формы по стратегиям для каждого инпута
	 * 
	 * @returns {ValidateObject}
	 */
	validate() {
		const elements = Array.from(this.form.elements);

		const validateData = elements.reduce(
			(validateData, input) => {
				const name = input.name;
				const currentStrategy = this.validateStrategy[name];

				if (!currentStrategy) return validateData;

				const hasValidateError = (!currentStrategy(input.value));

				if (hasValidateError) {
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

	/**
	 * Метод возвращает объект с данными формы,
	 * где имена свойств совпадают с именами инпутов.
	 * 
	 * @returns {Object}
	 */
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

	/**
	 *  Принимает объект с данными формы и устанавливает их
	 *  инпутам формы.
	 *  Поля кроме phone, fio, email игнорируются.
	 * 
	 * @param {Objecct} data 
	 */
	setData(data) {
		this.trackedInputs.forEach(name => {
			if (data.hasOwnProperty(name)) {
				this.form.elements[name].value = data[name];
			}
		});
	}

	/**
	 * Метод submit выполняет валидацию полей и
	 * отправку ajax-запроса, если валидация пройдена. 
	 * Вызывается по клику на кнопку отправить.
	 */
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

// form.setData({
// 	fio: 'Куликов Владимир Алексеевич',
// 	email: 'vovakuliov@ya.ru',
// 	phone: '+7(111)222-33-11'
// });

// console.log(form.validate())
// console.log(form.getData())

// form.setData({
// 	phone: '+7(111)222-33-1'
// });

// console.log(form.validate())
// console.log(form.getData())