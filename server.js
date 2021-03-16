const http = require('http');
const port = process.env.PORT || 8080;
const Koa = require('koa');
const koaBody = require('koa-body');
const koaStatic = require('koa-static');
const app = new Koa();
const path = require('path');
const public = path.join(__dirname, 'public');
const fs = require('fs');
let lastTicketId = null;

app.use(koaStatic(public));

app.use(koaBody({
    urlencoded: true,
    multipart: true
}));

app.use(async(ctx, next) => {
    ctx.response.set({'Access-Control-Allow-Origin':'*'});
    return await next();
});

app.use(async(ctx) => {
    let {method} = ctx.request.query;
    method ? method : method = ctx.request.body.method;
    
    switch (method) {
        case 'upload':
            if(!lastTicketId) {
                ctx.request.body.id = 1;
                lastTicketId = 1;
            } else {
                lastTicketId += 1;
                ctx.request.body.id = lastTicketId;
            }
            
            fs.readFile(path.join(__dirname,'public', 'img.json'), (err, data) => {
                if (err) {
                  console.error(err)
                  return
                }

                data = JSON.parse(data);
                data.push(ctx.request.body); 
                data = JSON.stringify(data);
                
                fs.writeFile(path.join(__dirname, 'public', 'img.json'), data, (err) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                });
            });
            
            return ctx.response.body = lastTicketId;; 
        
        case 'allImg':
            const allImgResponse = new Promise((resolve, reject) => {
                fs.readFile(path.join(__dirname,'public', 'img.json'), (err, data) => {
                    if (err) {
                      reject(err)
                      return
                    }
    
                    resolve(data);
                });
            });

            return allImgResponse.then(
                (result) => ctx.response.body = result,
                (err) => console.error('ошибка чтения ticket.json', err)
            );
        
        case 'deleteImg':
            fs.readFile(path.join(__dirname,'public', 'img.json'), (err, data) => {
                if (err) {
                  console.error(err)
                  return
                }

                data = JSON.parse(data)
                const deleteImgID = data.findIndex(img => img.id == ctx.request.body.id);
                data.splice(deleteImgID, 1);
                data = JSON.stringify(data);                   
               
                fs.writeFile(path.join(__dirname, 'public', 'img.json'), data, (err) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                });
            });
            
            ctx.response.body = 'ticket deleted';

            return;

            
        default:
            ctx.response.body = 'сервер работает';
            
            return;
    }
});

http.createServer(app.callback()).listen(port);
