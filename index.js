class MyForm {
    constructor() {
        this.form = document.querySelector('#myForm');
    }

    validate(form) {

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
        for (let key in data) {
            this.form.elements[key].value = data[key];
        }
    
    }
}

const form = new MyForm();
console.log(form.getData());

form.setData({
    fio: 'Vova Kulikov',
    email: 'vovakuliov@icloud.com'
})

console.log(form.getData());