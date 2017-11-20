import * as dust from "dustjs-linkedin";
import "dustjs-helpers";
import { ITemplate, ITemplateLoader, ITemplateRenderer, DevTemplateLoader, DefaultTemplateLoader } from "lambda-framework";
import DustTemplateRendererOptions from "./DustTemplateRendererOptions";

const processIsDev = process.env.NODE_ENV !== 'production';

export default class DustTemplateRenderer implements ITemplateRenderer {

  private _templateLoader: ITemplateLoader;
  private _extension: string;

  constructor(opts?: DustTemplateRendererOptions) {
    const options: {[name: string]: any} = opts || {};
    const isDev = options.isDev === undefined ? processIsDev : options.isDev;
    if (isDev) {
      dust.debugLevel = "INFO";
    }
    this._templateLoader = isDev ? new DevTemplateLoader("./") : new DefaultTemplateLoader("lambda-framework-website", 3000);

    this._extension = options.extension || ".dust";

    dust.onLoad = (templateName: string, params: {[name: string]: any}, callback: (Error, string) => void) => {
      templateName = this.addExtension(templateName);
      this._templateLoader.load(templateName, (err: Error, template: ITemplate) => {
        if (err) {
          callback(err, null);
        } else {
          callback(null, template.content);
        }
      });
    }
  }

  public render(fileName: string, params: {[name: string]: any}, engineConfig: {[name: string]: any}, callback: (Error, string) => void): void {
    fileName = this.addExtension(fileName);
    this._templateLoader.load(fileName, (err: Error, template: ITemplate) => {
      if(err) {
        callback(err, null);
      } else {
        try {
          const compiled: string = dust.compile(template.content, template.fileName);
          dust.loadSource(compiled);
          dust.render(template.fileName, params, callback);
        } catch(e) {
          callback(e, null);
        }
      }
    });
  }

  private addExtension(fileName: string): string {
    if(!fileName.endsWith(this._extension)) {
      return fileName + this._extension;
    } else {
      return fileName;
    }
  }

}
