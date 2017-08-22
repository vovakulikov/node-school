class CustomForm {
    constructor (formElement, trackedInputs) {
        this.form = formElement;
        this.trackedInputs = trackedInputs;


        this.validateStrategy =  {

            'fio': (value) => { 
                const trimString = value.replace(/\s+/g,' ').trim();

                return (trimString.split(' ').length === 3)
            },

            'email': (value) => {
                const correctDomens = ['ya.ru', 'yandex.ru',
                                       'yandex.ua', 'yandex.by', 
                                       'yandex.kz', 'yandex.com'];
                const [emailBody, emailDomen] = value.split('@'); 

                return (correctDomens.includes(emailDomen) && emailBody);

            }, 

            'phone': (value) => {
                const regPattert = /^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$/ ;
                const maskCondition = regPattert.test(value);

                const telNumbers = value.replace(/\D+/g,"").split('');
                const sumTel = telNumbers.reduce((sum, number) => {
                    sum += +number;
                    return sum;
                }, 0)


                return (maskCondition && (sumTel <= 30))
            }

        };

    }

    validate () {
        const elements = Array.from(this.form.elements);

        return elements.reduce((validateData, input) => {
            const name = input.name;
            const currentStrategy = this.validateStrategy[name];

            if (!currentStrategy) return validateData;

    
            if (!(currentStrategy(input.value))) {
                validateData.isValid = false;
                validateData.errorFields.push(name);
            }

            return validateData; 
        }, { isValid: true, errorFields: [] });

    }


    getData () {
        const elements = Array.from(this.form.elements);

        return elements.reduce((formData, element) => {
            const name = element.name;

            if (name) { formData[name] = element.value }

            return formData; 
        }, {});
    }

    setData (data) {
        this.trackedInputs.forEach((name) => {
            if (data.hasOwnProperty(name)) {
                this.form.elements[name].value = data[name];
            }
        });
    }
}

const form = new CustomForm(document.querySelector('#myForm'), ['fio','phone','email']);

form.setData({
    fio: 'Куликов Владимир Алексеевич',
    email: 'vova kuliov @ya.ru',
    phone: '+7(111)222-33-11'
})
console.log(form.validate());
console.log(form.getData())