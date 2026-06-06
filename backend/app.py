from flask import Flask, jsonify
import pandas as pd

app = Flask(__name__)

@app.route('/status')
def status():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(debug=True)
