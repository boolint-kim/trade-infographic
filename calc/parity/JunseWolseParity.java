import com.boolint.junsewolse.Utils;
import java.util.ArrayList;
import java.util.Random;

// JunseWolse 의 실제 Utils.java 를 그대로 컴파일해 입력과 결과 비트를 출력한다 → junsewolse-parity.js 가 비교
//   W junse rate deposit → calWolse / J deposit wolse rate → calJunse / D junse step → calDeposits_* 목록(개수·마지막 값)
public class JunseWolseParity {
    public static void main(String[] a) {
        Random rnd = new Random(20261027L);
        StringBuilder sb = new StringBuilder();
        int n = 0;
        double[] rates = {0.5, 2.5, 3.0, 4.5, 4.8, 5.0, 5.5, 7.25, 12.0};
        for (int i = 0; i < 6000; i++) {
            double j = (double) (rnd.nextInt(300000) + 1) * 10000;              // 전세 1만~30억(원)
            double r = rnd.nextBoolean() ? rates[rnd.nextInt(rates.length)] : Math.round(rnd.nextDouble() * 1200) / 100.0;
            double d = rnd.nextInt(10) == 0 ? j + 10000 : (double) rnd.nextInt((int) (j / 10000) + 1) * 10000;
            sb.append("W\t").append(b(j)).append('\t').append(b(r)).append('\t').append(b(d)).append('\t').append(b(Utils.calWolse(j, r, d))).append('\n'); n++;
            double w = (double) rnd.nextInt(5000) * 10000;                       // 월세 0~5천만(원)
            double dep = rnd.nextInt(8) == 0 ? 0 : (double) rnd.nextInt(100000) * 10000;
            if (r == 0) r = 5.0;
            sb.append("J\t").append(b(dep)).append('\t').append(b(w)).append('\t').append(b(r)).append('\t').append(b(Utils.calJunse(dep, w, r))).append('\n'); n++;
        }
        double[] js = {0, 1000000, 1000001, 9999999, 10000000, 50000000, 50000001, 79800 * 10000.0, 3e9};
        for (double j : js) {
            dep(sb, "100", j, Utils.calDeposits_100(j)); dep(sb, "1000", j, Utils.calDeposits_1000(j)); dep(sb, "5000", j, Utils.calDeposits_5000(j)); n += 3;
        }
        System.out.print(sb);
        System.err.println("cases " + n);
    }
    static long b(double d) { return Double.doubleToLongBits(d); }
    static void dep(StringBuilder sb, String step, double j, ArrayList<Double> l) {
        StringBuilder all = new StringBuilder();
        for (double v : l) all.append(b(v)).append(',');
        sb.append("D\t").append(step).append('\t').append(b(j)).append('\t').append(l.size()).append('\t').append(all).append('\n');
    }
}
