from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
@app.route('/encode')
def encode():
    return render_template('encodePage.html')

@app.route('/decode')
def decode():
    return render_template('decodePage.html')

@app.route('/plaintext-attack')
def plaintext_attack():
    return render_template('attackPage.html')

@app.route('/about')
def about():
    return render_template('aboutPage.html')

if __name__ == '__main__':
    app.run(debug=True)