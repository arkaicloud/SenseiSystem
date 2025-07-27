import React from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Student } from '@/types';
import { Link } from 'wouter';
import BeltIcon from '../ui/belt-icon';

interface PromotionStudent extends Student {
  promotionDate: string;
  nextBelt: string;
}

interface PromotionListProps {
  promotions: PromotionStudent[];
  title: string;
  showViewAll?: boolean;
  viewAllLink?: string;
}

export const PromotionList = ({ 
  promotions, 
  title, 
  showViewAll = true, 
  viewAllLink = '/promotions' 
}: PromotionListProps) => {
  const { t, locale } = useTranslations();

  const getPromotionText = (currentBelt: string, nextBelt: string) => {
    if (currentBelt === 'white' && nextBelt === 'blue') {
      return t('student.whiteBeltToBlue');
    } else if (currentBelt === 'blue' && nextBelt === 'purple') {
      return t('student.blueBeltToPurple');
    } else if (currentBelt === 'purple' && nextBelt === 'brown') {
      return t('student.purpleBeltToBrown');
    } else if (currentBelt === 'brown' && nextBelt === 'black') {
      return t('student.brownBeltToBlack');
    }
    return `${currentBelt} → ${nextBelt}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale).format(date);
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-white">{title}</h2>
          {showViewAll && (
            <Link href={viewAllLink}>
              <a className="text-sm font-medium text-primary hover:text-blue-400">
                {t('dashboard.viewAll')}
              </a>
            </Link>
          )}
        </div>
      </div>
      <ul className="divide-y divide-gray-700">
        {promotions.map((student) => (
          <li key={student.id} className="px-6 py-4 flex items-center">
            <Avatar>
              <AvatarFallback>
                {student.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4 flex-1">
              <div className="flex justify-between">
                <p className="text-sm font-medium text-white">{student.name}</p>
                <div className="flex items-center">
                  <BeltIcon belt={student.currentBelt} className="mr-1" />
                  <i className="fas fa-arrow-right text-xs text-gray-400 mx-1"></i>
                  <BeltIcon belt={student.nextBelt} className="mr-1" />
                </div>
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-sm text-gray-400">
                  {getPromotionText(student.currentBelt, student.nextBelt)}
                </p>
                <p className="text-sm text-blue-500">
                  {formatDate(student.promotionDate)}
                </p>
              </div>
            </div>
          </li>
        ))}
        {promotions.length === 0 && (
          <li className="px-6 py-4 text-center text-gray-400">
            No promotions found
          </li>
        )}
      </ul>
    </div>
  );
};

export default PromotionList;
