/**
 * moz_places
 */
export interface MozPlacesRow {
  id: number;
  url: string;
  title: string;
  rev_host: string;
  visit_count: number;
  hidden: number;
  typed: number;
  favicon_id: number;
  frecency: number;
  last_visit_date: number;
  guid: string;
  foreign_count: number;
  url_hash: number;
  description: string;
  preview_image_url: string;
  origin_id: number;
  site_name: string;
}
