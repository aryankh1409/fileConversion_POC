const express = require('express');
const port = 9000;

const app = express();
const mimeType = require('./mimeType');
const path = require('path');
const fs = require('fs');
const { PDFNet } = require('@pdftron/pdfnet-node');  // you may need to set up NODE_PATH environment variable to make this work.


const filesPath = ''
var pathname = ''
app.get('/files', (req, res) => {
    const inputPath = path.resolve(__dirname, filesPath);
    fs.readdir(inputPath, function (err, files) {
      if (err) {
        return console.log('Unable to scan directory: ' + err);
      }
      res.setHeader('Content-type', mimeType['.json']);
      res.end(JSON.stringify(files));
    });
  });

  app.get('/files/:filename', (req, res) => {
    const inputPath = path.resolve(__dirname, filesPath, req.params.filename);
    fs.readFile(inputPath, function (err, data) {
      if (err) {
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        const ext = path.parse(inputPath).ext;
        res.setHeader('Content-type', mimeType[ext] || 'text/plain');
        res.end(data);
      }
    });
  });



  app.get('/convert/:filename', (req, res) => {
    const filename = req.params.filename;
    let ext = path.parse(filename).ext;
  
    const inputPath = path.resolve(__dirname, filesPath, filename);
    const outputPath = path.resolve(__dirname, filesPath, `${filename}.pdf`);
  
    if (ext === '.pdf') {
      res.statusCode = 500;
      res.end(`File is already PDF.`);
    }
  
    const main = async () => {
      const pdfdoc = await PDFNet.PDFDoc.create();
      await pdfdoc.initSecurityHandler();
      await PDFNet.Convert.toPdf(pdfdoc, inputPath);
      pdfdoc.save(
        `${pathname}${filename}.pdf`,
        PDFNet.SDFDoc.SaveOptions.e_linearized,
      );
      ext = '.pdf';
    };
    console.log(outputPath)
    PDFNetEndpoint(main, outputPath, res);
  });


  const PDFNetEndpoint = (main, pathname, res) => {
    PDFNet.runWithCleanup(main)
    .then(() => {
      PDFNet.shutdown();
      fs.readFile(pathname, (err, data) => {
        if (err) {
          res.statusCode = 500;
          res.end(`Error getting the file: ${err}.`);
        } else {
          const ext = path.parse(pathname).ext;
          res.setHeader('Content-type', mimeType[ext] || 'text/plain');
          res.end(data);
        }
      });
    })
    .catch((error) => {
      res.statusCode = 500;
      res.send(error);
    });
};

app.listen(port, () =>
  console.log(
    `nodejs-convert-file-server listening at http://localhost:${port}`,
  ),
);



